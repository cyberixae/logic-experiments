import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { generateQuestion, instantiate, QuizQuestion } from '../quiz/generate'
import { fromSchemaRule, fromInstantiatedRule } from '../quiz/render'
import { QuizConfig } from '../quiz/config'

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

    const panel = document.createElement('div')
    panel.setAttribute('class', 'quiz-panel')

    const menuBtn = document.createElement('div')
    menuBtn.setAttribute('class', 'button')
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

    const answer = state.schemas[state.answerIndex]
    if (answer === undefined) return
    const instance = instantiate(answer)

    const questionArea = document.createElement('div')
    questionArea.setAttribute('class', 'quiz-question')
    const questionPre = document.createElement('pre')
    questionPre.setAttribute('class', 'rule hint')
    questionPre.innerHTML = fromInstantiatedRule(
      instance,
      state.guessIndex !== null ? answer.name : null,
    )
    questionArea.appendChild(questionPre)
    panel.appendChild(questionArea)

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
