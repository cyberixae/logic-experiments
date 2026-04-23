import { MountResult, Navigate } from './types'
import { t } from './i18n'
import {
  generateQuestion,
  InstantiatedRule,
  QuizQuestion,
} from '../quiz/generate'
import { fromSchemaRule } from '../quiz/render'
import { PRESETS } from '../quiz/config'
import { fromSequent, basic, printString } from '../render/print'
import { html } from '../render/segment'
import { sequent } from '../model/sequent'
import { layoutTree } from './tree'
import { createPausePopup } from './game'
import { qwertyKeyMap } from './input-mode'

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 100
const BLOCK_SIZE = 10
const ADVANCE_THRESHOLD = 8
const STAY_THRESHOLD = 5
const MAX_SCORE = 550

const AUTO_ZOOM_MIN = 0.8
const AUTO_ZOOM_MAX = 1.2
const AUTO_ZOOM_PAD = 0.9

// ── Types ──────────────────────────────────────────────────────────────────────

type RoundResult = { preset: number; correct: boolean }

type CuratedSession = {
  roundsPlayed: number
  currentPreset: number
  correctInBlock: number
  roundResults: RoundResult[]
  phase: 'playing' | 'done'
}

type QuizState = QuizQuestion & { guessIndex: number | null }

// ── Session helpers ────────────────────────────────────────────────────────────

const newSession = (): CuratedSession => ({
  roundsPlayed: 0,
  currentPreset: 0,
  correctInBlock: 0,
  roundResults: [],
  phase: 'playing',
})

const advancePreset = (current: number, correct: number): number => {
  if (correct >= ADVANCE_THRESHOLD)
    return Math.min(PRESETS.length - 1, current + 1)
  if (correct >= STAY_THRESHOLD) return current
  return Math.max(0, current - 1)
}

const totalScore = (results: RoundResult[]): number =>
  results.reduce((sum, r) => sum + (r.correct ? r.preset + 1 : 0), 0)

// ── Question tree ──────────────────────────────────────────────────────────────

const renderQuestionTree = (
  instance: InstantiatedRule,
  label: string | null,
): HTMLElement => {
  const node = document.createElement('div')
  node.setAttribute('class', 'tree-node')

  const premisesEl = document.createElement('div')
  premisesEl.setAttribute('class', 'tree-premises')
  for (const p of instance.premises) {
    const pNode = document.createElement('div')
    pNode.setAttribute('class', 'tree-node')
    const pSeq = document.createElement('div')
    pSeq.setAttribute('class', 'tree-sequent')
    pSeq.innerHTML = html(
      fromSequent(sequent(p.antecedent, p.succedent))(basic),
    )
    pNode.appendChild(pSeq)
    premisesEl.appendChild(pNode)
  }
  node.appendChild(premisesEl)

  const inference = document.createElement('div')
  inference.setAttribute('class', 'tree-inference')
  if (label !== null) {
    const labelEl = document.createElement('div')
    labelEl.setAttribute('class', 'tree-rule-label')
    labelEl.innerHTML = html(printString('(' + label + ')')(basic))
    inference.appendChild(labelEl)
  }
  node.appendChild(inference)

  const concSeq = document.createElement('div')
  concSeq.setAttribute('class', 'tree-sequent')
  concSeq.innerHTML = html(
    fromSequent(
      sequent(instance.conclusion.antecedent, instance.conclusion.succedent),
    )(basic),
  )
  node.appendChild(concSeq)

  return node
}

// ── Question generation ────────────────────────────────────────────────────────

const newQuestion = (presetIndex: number): QuizState | null => {
  const config = PRESETS[presetIndex]
  if (config === undefined) return null
  const q = generateQuestion(config)
  if (q === null) return null
  return { ...q, guessIndex: null }
}

// ── Mount ──────────────────────────────────────────────────────────────────────

export const mountMatchCurated = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  let session = newSession()
  let question: QuizState | null = newQuestion(session.currentPreset)
  let zoom = 1
  let pendingAutoZoom = true
  let regenerateTimer: ReturnType<typeof setTimeout> | null = null
  let pausePopupOpen = false

  const render = () => {
    if (regenerateTimer !== null) {
      clearTimeout(regenerateTimer)
      regenerateTimer = null
    }
    container.innerHTML = ''
    if (session.phase === 'done') {
      renderSummary()
    } else {
      renderGame()
    }
  }

  const renderSummary = () => {
    const panel = document.createElement('div')
    panel.setAttribute('class', 'menu')

    const title = document.createElement('div')
    title.setAttribute('class', 'menu-title')
    title.textContent = t('matchDone')
    panel.appendChild(title)

    const info = document.createElement('div')
    info.setAttribute('class', 'menu-modes')

    const score = totalScore(session.roundResults)
    const scoreEl = document.createElement('div')
    scoreEl.textContent = t('matchScore')
      .replace('{score}', String(score))
      .replace('{max}', String(MAX_SCORE))
    info.appendChild(scoreEl)

    const presetEl = document.createElement('div')
    presetEl.textContent = t('matchFinalPreset').replace(
      '{preset}',
      String(session.currentPreset),
    )
    info.appendChild(presetEl)

    panel.appendChild(info)

    const btns = document.createElement('div')
    btns.setAttribute('class', 'menu-modes')

    const again = document.createElement('div')
    again.setAttribute('class', 'button menu-mode')
    again.textContent = t('playAgain')
    again.onclick = () => {
      session = newSession()
      question = newQuestion(session.currentPreset)
      zoom = 1
      pendingAutoZoom = true
      render()
    }
    btns.appendChild(again)

    const exit = document.createElement('div')
    exit.setAttribute('class', 'button menu-mode')
    exit.textContent = t('exitToMainMenu')
    exit.onclick = () => navigate('menu')
    btns.appendChild(exit)

    panel.appendChild(btns)
    container.appendChild(panel)
  }

  const renderGame = () => {
    const q = question
    if (q !== null) {
      const answer = q.schemas[q.answerIndex]
      if (answer !== undefined) {
        const questionArea = document.createElement('div')
        questionArea.setAttribute('class', 'quiz-question')
        questionArea.style.setProperty('--tree-zoom', String(zoom))
        const treeEl = renderQuestionTree(
          q.instance,
          q.guessIndex !== null ? answer.name : ' ? ',
        )
        questionArea.appendChild(treeEl)
        container.appendChild(questionArea)
        requestAnimationFrame(() => {
          layoutTree(treeEl, { skipActiveScroll: true })
          if (pendingAutoZoom) {
            pendingAutoZoom = false
            const premiseSequents = Array.from(
              treeEl.querySelectorAll<HTMLElement>(
                ':scope > .tree-premises > .tree-node > .tree-sequent',
              ),
            )
            const conclusionSequent = treeEl.querySelector<HTMLElement>(
              ':scope > .tree-sequent',
            )
            const sequents = [
              ...premiseSequents,
              ...(conclusionSequent ? [conclusionSequent] : []),
            ]
            const widest = sequents.reduce<HTMLElement | null>(
              (max, s) =>
                max === null ||
                s.getBoundingClientRect().width >
                  max.getBoundingClientRect().width
                  ? s
                  : max,
              null,
            )
            const areaRect = questionArea.getBoundingClientRect()
            const areaStyle = getComputedStyle(questionArea)
            const availW =
              areaRect.width -
              parseFloat(areaStyle.paddingLeft) -
              parseFloat(areaStyle.paddingRight)
            if (
              widest &&
              widest.getBoundingClientRect().width > 0 &&
              availW > 0
            ) {
              const target = Math.max(
                AUTO_ZOOM_MIN,
                Math.min(
                  AUTO_ZOOM_MAX,
                  (zoom * availW * AUTO_ZOOM_PAD) /
                    widest.getBoundingClientRect().width,
                ),
              )
              if (Math.abs(target - zoom) > 0.01) {
                zoom = target
                questionArea.style.setProperty('--tree-zoom', String(zoom))
                layoutTree(treeEl, { skipActiveScroll: true })
              }
            }
          }
          requestAnimationFrame(() => {
            const treeWidth = treeEl.getBoundingClientRect().width
            const areaWidth = questionArea.getBoundingClientRect().width
            questionArea.scrollLeft = (treeWidth - areaWidth) / 2
          })
        })
      }
    }

    const panel = document.createElement('div')
    panel.setAttribute('class', 'quiz-panel')

    const menuBtn = document.createElement('div')
    menuBtn.setAttribute('class', 'button quiz-menu-btn')
    menuBtn.textContent = t('menu')
    menuBtn.onclick = () => {
      pausePopupOpen = true
      render()
    }
    panel.appendChild(menuBtn)

    const progress = document.createElement('div')
    progress.setAttribute('class', 'curated-progress')
    progress.textContent =
      String(session.roundsPlayed + 1) + ' / ' + String(TOTAL_ROUNDS)
    panel.appendChild(progress)

    if (q === null) {
      const msg = document.createElement('div')
      msg.textContent = 'No question available.'
      panel.appendChild(msg)
      container.appendChild(panel)
      return
    }

    const cardsArea = document.createElement('div')
    cardsArea.setAttribute('class', 'quiz-cards')

    for (let i = 0; i < q.schemas.length; i += 1) {
      const schema = q.schemas[i]
      if (schema === undefined) continue
      const card = document.createElement('pre')
      let cls = 'quiz-card rule button'
      if (q.guessIndex !== null) {
        if (i === q.answerIndex) cls += ' quiz-card-correct'
        else if (i === q.guessIndex) cls += ' quiz-card-wrong'
        else cls += ' disabled'
      }
      card.setAttribute('class', cls)
      card.innerHTML =
        '<span class="rule-label long">' +
        fromSchemaRule(schema, true) +
        '</span>' +
        '<span class="rule-label short">' +
        fromSchemaRule(schema, false) +
        '</span>'

      if (q.guessIndex === null) {
        const idx = i
        card.onclick = () => guess(idx)
      }
      cardsArea.appendChild(card)
    }
    panel.appendChild(cardsArea)
    container.appendChild(panel)

    if (pausePopupOpen) {
      const resume = () => {
        pausePopupOpen = false
        render()
      }
      const reset = () => {
        pausePopupOpen = false
        session = newSession()
        question = newQuestion(session.currentPreset)
        zoom = 1
        pendingAutoZoom = true
        render()
      }
      const exitToMenu = () => {
        pausePopupOpen = false
        navigate('menu')
      }
      const customChallenge = () => {
        pausePopupOpen = false
        navigate('match-config')
      }
      container.appendChild(
        createPausePopup(
          resume,
          exitToMenu,
          reset,
          false,
          undefined,
          undefined,
          customChallenge,
        ),
      )
    }
  }

  const guess = (idx: number) => {
    if (question === null || question.guessIndex !== null) return
    const correct = idx === question.answerIndex
    question = { ...question, guessIndex: idx }
    render()
    regenerateTimer = setTimeout(() => {
      session.roundResults.push({ preset: session.currentPreset, correct })
      session.roundsPlayed += 1
      session.correctInBlock += correct ? 1 : 0

      if (session.roundsPlayed % BLOCK_SIZE === 0) {
        session.currentPreset = advancePreset(
          session.currentPreset,
          session.correctInBlock,
        )
        session.correctInBlock = 0
      }

      if (session.roundsPlayed === TOTAL_ROUNDS) {
        session.phase = 'done'
        question = null
        render()
        return
      }

      question = newQuestion(session.currentPreset)
      pendingAutoZoom = true
      render()
    }, 1500)
  }

  render()

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    if (session.phase === 'done') return
    const action = qwertyKeyMap[ev.code]
    if (action === 'menu') {
      pausePopupOpen = !pausePopupOpen
      render()
      return
    }
    if (pausePopupOpen) {
      if (action === 'undo') {
        pausePopupOpen = false
        render()
      } else if (action === 'reset') {
        pausePopupOpen = false
        session = newSession()
        question = newQuestion(session.currentPreset)
        zoom = 1
        pendingAutoZoom = true
        render()
      } else if (action === 'exit') {
        pausePopupOpen = false
        navigate('menu')
      }
      return
    }
    const digitMatch = ev.code.match(/^Digit([1-4])$/)
    if (digitMatch && question !== null && question.guessIndex === null) {
      const idxStr = digitMatch[1]
      if (idxStr === undefined) return
      const idx = parseInt(idxStr) - 1
      if (idx < question.schemas.length) {
        guess(idx)
      }
    }
  }
  document.addEventListener('keydown', handleKey)

  return {
    cleanup: () => {
      document.removeEventListener('keydown', handleKey)
      if (regenerateTimer !== null) {
        clearTimeout(regenerateTimer)
        regenerateTimer = null
      }
    },
    rerender: render,
  }
}
