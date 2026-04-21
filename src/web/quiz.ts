import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { generateQuestion, instantiate, InstantiatedRule, QuizQuestion } from '../quiz/generate'
import { fromSchemaRule } from '../quiz/render'
import { QuizConfig } from '../quiz/config'
import { fromSequent, basic, printString } from '../render/print'
import { html } from '../render/segment'
import { sequent } from '../model/sequent'
import { layoutTree } from './tree'

// ── Question tree ──────────────────────────────────────────────────────────────

const renderQuestionTree = (instance: InstantiatedRule, label: string | null): HTMLElement => {
  const node = document.createElement('div')
  node.setAttribute('class', 'tree-node')

  const premisesEl = document.createElement('div')
  premisesEl.setAttribute('class', 'tree-premises')
  for (const p of instance.premises) {
    const pNode = document.createElement('div')
    pNode.setAttribute('class', 'tree-node')
    const pSeq = document.createElement('div')
    pSeq.setAttribute('class', 'tree-sequent')
    pSeq.innerHTML = html(fromSequent(sequent(p.antecedent, p.succedent))(basic))
    pNode.appendChild(pSeq)
    premisesEl.appendChild(pNode)
  }
  node.appendChild(premisesEl)

  const inference = document.createElement('div')
  inference.setAttribute('class', 'tree-inference')
  if (label !== null) {
    const labelEl = document.createElement('div')
    labelEl.setAttribute('class', 'tree-rule-label')
    labelEl.innerHTML = html(printString(label)(basic))
    inference.appendChild(labelEl)
  }
  node.appendChild(inference)

  const concSeq = document.createElement('div')
  concSeq.setAttribute('class', 'tree-sequent')
  concSeq.innerHTML = html(fromSequent(sequent(instance.conclusion.antecedent, instance.conclusion.succedent))(basic))
  node.appendChild(concSeq)

  return node
}

// ── Quiz state ─────────────────────────────────────────────────────────────────

type QuizState = QuizQuestion & { guessIndex: number | null }

const newState = (config: QuizConfig): QuizState | null => {
  const q = generateQuestion(config)
  if (q === null) return null
  return { ...q, guessIndex: null }
}

// ── Mount ──────────────────────────────────────────────────────────────────────

export const mountQuiz = (
  container: HTMLElement,
  navigate: Navigate,
  config: QuizConfig,
): MountResult => {
  let state: QuizState | null = newState(config)
  let regenerateTimer: ReturnType<typeof setTimeout> | null = null

  const render = () => {
    if (regenerateTimer !== null) {
      clearTimeout(regenerateTimer)
      regenerateTimer = null
    }
    container.innerHTML = ''

    const answer = state?.schemas[state.answerIndex]
    const instance = answer !== undefined ? instantiate(answer) : null

    if (instance !== null && answer !== undefined) {
      const questionArea = document.createElement('div')
      questionArea.setAttribute('class', 'quiz-question')
      const treeEl = renderQuestionTree(
        instance,
        state !== null && state.guessIndex !== null ? answer.name : null,
      )
      questionArea.appendChild(treeEl)
      container.appendChild(questionArea)
      requestAnimationFrame(() => {
        layoutTree(treeEl, { skipActiveScroll: true })
      })
    }

    const panel = document.createElement('div')
    panel.setAttribute('class', 'quiz-panel')

    const menuBtn = document.createElement('div')
    menuBtn.setAttribute('class', 'button quiz-menu-btn')
    menuBtn.textContent = t('menu')
    menuBtn.onclick = () => navigate('quiz-config')
    panel.appendChild(menuBtn)

    if (state === null) {
      const msg = document.createElement('div')
      msg.textContent = 'Enable at least one symbol to play.'
      panel.appendChild(msg)
      container.appendChild(panel)
      return
    }

    const cardsArea = document.createElement('div')
    cardsArea.setAttribute('class', 'quiz-cards')

    for (let i = 0; i < state.schemas.length; i += 1) {
      const schema = state.schemas[i]
      if (schema === undefined) continue
      const card = document.createElement('pre')
      let cls = 'quiz-card rule'
      if (state.guessIndex !== null) {
        cls += ' hint'
        if (i === state.answerIndex) cls += ' quiz-card-correct'
        else if (i === state.guessIndex) cls += ' quiz-card-wrong'
      } else {
        cls += ' button'
      }
      card.setAttribute('class', cls)
      card.innerHTML = fromSchemaRule(schema)

      if (state.guessIndex === null) {
        const idx = i
        card.onclick = () => {
          if (state === null) return
          state = { ...state, guessIndex: idx }
          render()
          regenerateTimer = setTimeout(() => {
            state = newState(config)
            render()
          }, 1500)
        }
      }
      cardsArea.appendChild(card)
    }
    panel.appendChild(cardsArea)
    container.appendChild(panel)
  }

  render()

  return {
    cleanup: () => {
      if (regenerateTimer !== null) {
        clearTimeout(regenerateTimer)
        regenerateTimer = null
      }
    },
    rerender: render,
  }
}
