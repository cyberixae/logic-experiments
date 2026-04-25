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
const CHOICE_COUNT = 4
const MAX_SCORE = 5500

const AUTO_ZOOM_MIN = 0.8
const AUTO_ZOOM_MAX = 1.2
const AUTO_ZOOM_PAD = 0.9

// ── Types ──────────────────────────────────────────────────────────────────────

type RoundResult = { preset: number; attempts: number }

type CuratedSession = {
  roundsPlayed: number
  currentPreset: number
  correctInBlock: number
  roundResults: RoundResult[]
  phase: 'playing' | 'done'
}

type QuizState = QuizQuestion & {
  wrongIndices: Set<number>
  solved: boolean
  flaggedIndices: Set<number>
}

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

const scoreForRound = (preset: number, attempts: number): number => {
  if (attempts >= CHOICE_COUNT) return 0
  return Math.floor(((preset + 1) * 10) / Math.pow(2, attempts - 1))
}

const totalScore = (results: RoundResult[]): number =>
  results.reduce((sum, r) => sum + scoreForRound(r.preset, r.attempts), 0)

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
  return {
    ...q,
    wrongIndices: new Set(),
    solved: false,
    flaggedIndices: new Set(),
  }
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
  let cardEls: Array<{ card: HTMLElement; flagBtn: HTMLElement }> = []
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

    const wrapper = document.createElement('div')
    wrapper.setAttribute('class', 'match-viewport')

    const layout = document.createElement('div')
    layout.setAttribute('class', 'match-layout')
    wrapper.appendChild(layout)

    // ── HUD ───────────────────────────────────────────────────────────────────────

    const hud = document.createElement('div')
    hud.setAttribute('class', 'match-hud')

    const menuBtn = document.createElement('div')
    menuBtn.setAttribute('class', 'button quiz-menu-btn')
    menuBtn.textContent = '⋮'
    menuBtn.onclick = () => {
      pausePopupOpen = true
      render()
    }
    hud.appendChild(menuBtn)

    const scoreEl = document.createElement('div')
    scoreEl.setAttribute('class', 'curated-score')
    scoreEl.textContent = String(totalScore(session.roundResults))
    hud.appendChild(scoreEl)

    const stats = document.createElement('div')
    stats.setAttribute('class', 'curated-stats')
    const roundEl = document.createElement('div')
    roundEl.textContent =
      t('round') +
      ' ' +
      String(session.roundsPlayed + 1) +
      '/' +
      String(TOTAL_ROUNDS)
    stats.appendChild(roundEl)
    const levelEl = document.createElement('div')
    levelEl.textContent = t('score') + ' x' + String(session.currentPreset + 1)
    stats.appendChild(levelEl)
    hud.appendChild(stats)

    layout.appendChild(hud)

    // ── Question ──────────────────────────────────────────────────────────────────

    if (q !== null) {
      const answer = q.schemas[q.answerIndex]
      if (answer !== undefined) {
        const questionArea = document.createElement('div')
        questionArea.setAttribute('class', 'match-question')
        questionArea.style.setProperty('--tree-zoom', String(zoom))
        const treeEl = renderQuestionTree(
          q.instance,
          q.solved ? answer.name : ' ? ',
        )
        questionArea.appendChild(treeEl)
        layout.appendChild(questionArea)
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
            const padLeft = parseFloat(
              getComputedStyle(questionArea).paddingLeft,
            )
            questionArea.scrollLeft = padLeft + (treeWidth - areaWidth) / 2
          })
        })
      }
    }

    // ── Answers ───────────────────────────────────────────────────────────────────

    const answers = document.createElement('div')
    answers.setAttribute('class', 'match-answers')

    // ── Controls ──────────────────────────────────────────────────────────────────

    const controls = document.createElement('div')
    controls.setAttribute('class', 'match-controls')

    if (q === null) {
      const msg = document.createElement('div')
      msg.textContent = 'No question available.'
      answers.appendChild(msg)
      layout.appendChild(answers)
      layout.appendChild(controls)
      container.appendChild(wrapper)
      return
    }

    cardEls = []
    const cardsArea = document.createElement('div')
    cardsArea.setAttribute('class', 'quiz-cards')
    const flagsRow = document.createElement('div')
    flagsRow.setAttribute('class', 'quiz-flags')

    for (let i = 0; i < q.schemas.length; i += 1) {
      const schema = q.schemas[i]
      if (schema === undefined) continue
      const isWrong = q.wrongIndices.has(i)
      const flagged = q.flaggedIndices.has(i)

      const card = document.createElement('pre')
      let cls = 'quiz-card rule button'
      if (q.solved) {
        if (i === q.answerIndex) cls += ' quiz-card-correct'
        else if (isWrong) cls += ' quiz-card-wrong'
        else cls += ' disabled'
      } else if (isWrong) {
        cls += ' quiz-card-wrong'
      } else if (flagged) {
        cls += ' disabled'
      }
      card.setAttribute('class', cls)
      card.innerHTML =
        '<span class="rule-label long">' +
        fromSchemaRule(schema, true) +
        '</span>' +
        '<span class="rule-label short">' +
        fromSchemaRule(schema, true) +
        '</span>'

      if (!q.solved && !isWrong && !flagged) {
        const idx = i
        card.onclick = () => guess(idx)
      }

      const slot = document.createElement('div')
      slot.setAttribute('class', 'quiz-card-slot')
      slot.appendChild(card)
      cardsArea.appendChild(slot)

      const flagBtn = document.createElement('div')
      flagBtn.setAttribute('class', 'button toggle quiz-card-flag')
      flagBtn.textContent = '🚩'
      const led = document.createElement('span')
      led.setAttribute('class', 'led' + (flagged ? ' on' : ''))
      flagBtn.appendChild(led)
      if (isWrong || q.solved) {
        flagBtn.classList.add('disabled')
      } else {
        const idx = i
        flagBtn.onclick = () => {
          if (question === null || question.solved) return
          if (question.flaggedIndices.has(idx)) {
            question.flaggedIndices.delete(idx)
            card.classList.remove('disabled')
            card.onclick = () => guess(idx)
            led.classList.remove('on')
          } else {
            question.flaggedIndices.add(idx)
            card.classList.add('disabled')
            card.onclick = null
            led.classList.add('on')
          }
        }
      }
      cardEls[i] = { card, flagBtn }
      flagsRow.appendChild(flagBtn)
    }
    answers.appendChild(cardsArea)
    layout.appendChild(answers)
    controls.appendChild(flagsRow)
    layout.appendChild(controls)
    container.appendChild(wrapper)

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
    if (question === null || question.solved) return
    if (question.wrongIndices.has(idx)) return

    if (idx === question.answerIndex) {
      const firstTry = question.wrongIndices.size === 0
      const wrongCount = question.wrongIndices.size
      question = { ...question, solved: true }
      render()
      regenerateTimer = setTimeout(() => {
        const attempts = wrongCount + 1
        session.roundResults.push({ preset: session.currentPreset, attempts })
        session.roundsPlayed += 1
        if (firstTry) session.correctInBlock += 1

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
    } else {
      question = {
        ...question,
        wrongIndices: new Set([...question.wrongIndices, idx]),
      }
      const el = cardEls[idx]
      if (el !== undefined) {
        el.card.classList.add('quiz-card-wrong')
        el.card.onclick = null
        el.flagBtn.classList.add('disabled')
        el.flagBtn.onclick = null
      }
    }
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
    if (digitMatch && question !== null && !question.solved) {
      const idxStr = digitMatch[1]
      if (idxStr === undefined) return
      const idx = parseInt(idxStr) - 1
      if (
        idx < question.schemas.length &&
        !question.wrongIndices.has(idx) &&
        !question.flaggedIndices.has(idx)
      ) {
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
