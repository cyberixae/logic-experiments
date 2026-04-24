import { MountResult, Navigate } from './types'
import { t } from './i18n'
import {
  generateQuestion,
  InstantiatedRule,
  QuizQuestion,
} from '../quiz/generate'
import { fromSchemaRule } from '../quiz/render'
import { QuizConfig } from '../quiz/config'
import { fromSequent, basic, printString } from '../render/print'
import { html } from '../render/segment'
import { sequent } from '../model/sequent'
import { layoutTree } from './tree'
import { createPausePopup } from './game'
import { qwertyKeyMap } from './input-mode'

const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const ZOOM_STEP = 0.2
const AUTO_ZOOM_MIN = 0.8
const AUTO_ZOOM_MAX = 1.2
const AUTO_ZOOM_PAD = 0.9

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

// ── Quiz state ─────────────────────────────────────────────────────────────────

type QuizState = QuizQuestion & {
  wrongIndices: Set<number>
  solved: boolean
  flaggedIndices: Set<number>
}

const newState = (config: QuizConfig): QuizState | null => {
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

export const mountQuiz = (
  container: HTMLElement,
  navigate: Navigate,
  config: QuizConfig,
): MountResult => {
  let state: QuizState | null = newState(config)
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

    const answer = state?.schemas[state.answerIndex]
    const instance = state?.instance ?? null

    if (instance !== null && answer !== undefined) {
      const questionArea = document.createElement('div')
      questionArea.setAttribute('class', 'quiz-question')
      questionArea.style.setProperty('--tree-zoom', String(zoom))
      const treeEl = renderQuestionTree(
        instance,
        state !== null && state.solved ? answer.name : '\u00a0?\u00a0',
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
          const padLeft = parseFloat(getComputedStyle(questionArea).paddingLeft)
          questionArea.scrollLeft = padLeft + (treeWidth - areaWidth) / 2
        })
      })
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

    if (state === null) {
      const msg = document.createElement('div')
      msg.textContent = 'Enable at least one symbol to play.'
      panel.appendChild(msg)
      container.appendChild(panel)
      return
    }

    const zoomRow = document.createElement('div')
    zoomRow.setAttribute('class', 'quiz-zoom')

    const zoomOut = document.createElement('div')
    zoomOut.setAttribute(
      'class',
      'button' + (zoom <= ZOOM_MIN ? ' disabled' : ''),
    )
    zoomOut.textContent = '−'
    zoomOut.onclick = () => {
      zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP)
      render()
    }
    zoomRow.appendChild(zoomOut)

    const zoomReset = document.createElement('div')
    zoomReset.setAttribute('class', 'button')
    zoomReset.textContent = '⊙'
    zoomReset.onclick = () => {
      zoom = 1
      render()
    }
    zoomRow.appendChild(zoomReset)

    const zoomIn = document.createElement('div')
    zoomIn.setAttribute(
      'class',
      'button' + (zoom >= ZOOM_MAX ? ' disabled' : ''),
    )
    zoomIn.textContent = '+'
    zoomIn.onclick = () => {
      zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP)
      render()
    }
    zoomRow.appendChild(zoomIn)

    panel.appendChild(zoomRow)

    cardEls = []
    const cardsArea = document.createElement('div')
    cardsArea.setAttribute('class', 'quiz-cards')
    const flagsRow = state.solved ? null : document.createElement('div')
    if (flagsRow !== null) flagsRow.setAttribute('class', 'quiz-flags')

    for (let i = 0; i < state.schemas.length; i += 1) {
      const schema = state.schemas[i]
      if (schema === undefined) continue
      const isWrong = state.wrongIndices.has(i)
      const flagged = state.flaggedIndices.has(i)

      const card = document.createElement('pre')
      let cls = 'quiz-card rule button'
      if (state.solved) {
        if (i === state.answerIndex) cls += ' quiz-card-correct'
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

      const flagBtn = document.createElement('div')
      flagBtn.setAttribute('class', 'button toggle quiz-card-flag')
      flagBtn.textContent = '🚩'
      const led = document.createElement('span')
      led.setAttribute('class', 'led' + (flagged ? ' on' : ''))
      flagBtn.appendChild(led)

      if (!state.solved && !isWrong && !flagged) {
        const idx = i
        card.onclick = () => {
          if (state === null || state.solved) return
          if (state.wrongIndices.has(idx)) return
          if (idx === state.answerIndex) {
            state = { ...state, solved: true }
            render()
            regenerateTimer = setTimeout(() => {
              state = newState(config)
              pendingAutoZoom = true
              render()
            }, 1500)
          } else {
            state = {
              ...state,
              wrongIndices: new Set([...state.wrongIndices, idx]),
            }
            card.classList.add('quiz-card-wrong')
            card.onclick = null
            flagBtn.classList.add('disabled')
            flagBtn.onclick = null
          }
        }
      }

      if (isWrong) {
        flagBtn.classList.add('disabled')
      } else {
        flagBtn.onclick = () => {
          if (state === null || state.solved) return
          if (state.flaggedIndices.has(i)) {
            state.flaggedIndices.delete(i)
            card.classList.remove('disabled')
            const idx = i
            card.onclick = () => {
              if (state === null || state.solved) return
              if (state.wrongIndices.has(idx)) return
              if (idx === state.answerIndex) {
                state = { ...state, solved: true }
                render()
                regenerateTimer = setTimeout(() => {
                  state = newState(config)
                  pendingAutoZoom = true
                  render()
                }, 1500)
              } else {
                state = {
                  ...state,
                  wrongIndices: new Set([...state.wrongIndices, idx]),
                }
                card.classList.add('quiz-card-wrong')
                card.onclick = null
                flagBtn.classList.add('disabled')
                flagBtn.onclick = null
              }
            }
            led.classList.remove('on')
          } else {
            state.flaggedIndices.add(i)
            card.classList.add('disabled')
            card.onclick = null
            led.classList.add('on')
          }
        }
      }

      cardEls[i] = { card, flagBtn }

      const slot = document.createElement('div')
      slot.setAttribute('class', 'quiz-card-slot')
      slot.appendChild(card)
      cardsArea.appendChild(slot)
      if (flagsRow !== null) flagsRow.appendChild(flagBtn)
    }
    panel.appendChild(cardsArea)
    if (flagsRow !== null) panel.appendChild(flagsRow)
    container.appendChild(panel)

    if (pausePopupOpen) {
      const resume = () => {
        pausePopupOpen = false
        render()
      }
      const exitToMenu = () => {
        pausePopupOpen = false
        navigate('menu')
      }
      const openSettings = () => {
        pausePopupOpen = false
        navigate('match-config')
      }
      const restart = () => {
        pausePopupOpen = false
        state = newState(config)
        pendingAutoZoom = true
        render()
      }
      container.appendChild(
        createPausePopup(
          resume,
          exitToMenu,
          restart,
          false,
          undefined,
          openSettings,
        ),
      )
    }
  }

  render()

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    const digitMatch = ev.code.match(/^Digit([1-4])$/)
    if (digitMatch && !pausePopupOpen && state !== null && !state.solved) {
      const idxStr = digitMatch[1]
      if (idxStr === undefined) return
      const idx = parseInt(idxStr) - 1
      if (
        idx < state.schemas.length &&
        !state.wrongIndices.has(idx) &&
        !state.flaggedIndices.has(idx)
      ) {
        if (idx === state.answerIndex) {
          state = { ...state, solved: true }
          render()
          regenerateTimer = setTimeout(() => {
            state = newState(config)
            pendingAutoZoom = true
            render()
          }, 1500)
        } else {
          state = {
            ...state,
            wrongIndices: new Set([...state.wrongIndices, idx]),
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
      return
    }
    const action = qwertyKeyMap[ev.code]
    if (!action) return
    if (action === 'menu') {
      pausePopupOpen = !pausePopupOpen
      render()
    } else if (action === 'reset') {
      pausePopupOpen = false
      state = newState(config)
      pendingAutoZoom = true
      render()
    } else if (pausePopupOpen) {
      if (action === 'undo') {
        pausePopupOpen = false
        render()
      } else if (action === 'exit') {
        pausePopupOpen = false
        navigate('menu')
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
