import { MountResult, Navigate } from './types'
import { t } from './i18n'
import {
  generateQuestion,
  instantiate,
  InstantiatedSequent,
  QuizQuestion,
} from '../quiz/generate'
import { RuleSchema, SchemaContext, SchemaFormula } from '../quiz/schema'
import { QuizConfig } from '../quiz/config'
import { fromSequent, basic } from '../render/print'
import { html } from '../render/segment'
import { sequent } from '../model/sequent'

// ── Schema rendering ───────────────────────────────────────────────────────────

const renderSchemaFormula = (f: SchemaFormula): string => {
  switch (f.kind) {
    case 'var':
      return `<em>${f.name}</em>`
    case 'atom':
      return escapeHtml(atomGlyph(f.value))
    case 'falsum':
      return '<span class="connective">⊥</span>'
    case 'verum':
      return '<span class="connective">⊤</span>'
    case 'negation':
      return `<span class="connective">¬</span>${maybeParens(f.negand, 3)}`
    case 'implication':
      return `${maybeParens(f.antecedent, 2)}${' '}<span class="connective">→</span>${' '}${maybeParens(f.consequent, 1)}`
    case 'conjunction':
      return `${maybeParens(f.leftConjunct, 3)}${' '}<span class="connective">∧</span>${' '}${maybeParens(f.rightConjunct, 3)}`
    case 'disjunction':
      return `${maybeParens(f.leftDisjunct, 3)}${' '}<span class="connective">∨</span>${' '}${maybeParens(f.rightDisjunct, 3)}`
  }
}

const atomGlyph = (value: string): string => {
  const glyphs: Record<string, string> = {
    p: '🐧',
    q: '🦜',
    r: '🦃',
    s: '🦆',
  }
  return glyphs[value] ?? value
}

const schemaFormulaPrecedence = (f: SchemaFormula): number => {
  switch (f.kind) {
    case 'var':
    case 'atom':
    case 'falsum':
    case 'verum':
      return 4
    case 'negation':
      return 3
    case 'conjunction':
    case 'disjunction':
      return 2
    case 'implication':
      return 1
  }
}

const maybeParens = (f: SchemaFormula, minPrec: number): string => {
  const rendered = renderSchemaFormula(f)
  return schemaFormulaPrecedence(f) >= minPrec
    ? rendered
    : `<span class="parenthesis">(</span>${rendered}<span class="parenthesis">)</span>`
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const renderSchemaContext = (ctx: SchemaContext): string => {
  const parts: string[] = []
  for (const item of ctx) {
    if (item.kind === 'seq') {
      parts.push(`<em>${item.name}</em>`)
    } else {
      parts.push(renderSchemaFormula(item))
    }
  }
  if (parts.length === 0) return ''
  return parts.join('<span class="connective">,</span> ')
}

const renderSchemaSequentHtml = (s: {
  antecedent: SchemaContext
  succedent: SchemaContext
}): string => {
  const ant = renderSchemaContext(s.antecedent)
  const suc = renderSchemaContext(s.succedent)
  return `${ant}<span class="turnstile"> ⊢ </span>${suc}`
}

// ── Concrete sequent rendering ─────────────────────────────────────────────────

const renderConcreteSequent = (s: InstantiatedSequent): string => {
  const seq = sequent(s.antecedent, s.succedent)
  return html(fromSequent(seq)(basic))
}

// ── Derivation DOM ─────────────────────────────────────────────────────────────

const createDerivationEl = (
  premises: InstantiatedSequent[],
  conclusion: InstantiatedSequent,
  ruleName: string | null,
): HTMLElement => {
  const node = document.createElement('div')
  node.setAttribute('class', 'tree-node')

  if (premises.length > 0) {
    const premisesEl = document.createElement('div')
    premisesEl.setAttribute('class', 'tree-premises')
    for (const p of premises) {
      const pNode = document.createElement('div')
      pNode.setAttribute('class', 'tree-node')
      const pSeq = document.createElement('div')
      pSeq.setAttribute('class', 'tree-sequent')
      pSeq.innerHTML = renderConcreteSequent(p)
      pNode.appendChild(pSeq)
      premisesEl.appendChild(pNode)
    }
    node.appendChild(premisesEl)
  }

  const inference = document.createElement('div')
  inference.setAttribute('class', 'tree-inference')
  if (ruleName !== null) {
    const label = document.createElement('div')
    label.setAttribute('class', 'tree-rule-label')
    label.textContent = ruleName
    inference.appendChild(label)
  }
  node.appendChild(inference)

  const concSeq = document.createElement('div')
  concSeq.setAttribute('class', 'tree-sequent')
  concSeq.innerHTML = renderConcreteSequent(conclusion)
  node.appendChild(concSeq)

  return node
}

const createSchemaCardEl = (schema: RuleSchema): HTMLElement => {
  const node = document.createElement('div')
  node.setAttribute('class', 'tree-node')

  if (schema.premises.length > 0) {
    const premisesEl = document.createElement('div')
    premisesEl.setAttribute('class', 'tree-premises')
    for (const p of schema.premises) {
      const pNode = document.createElement('div')
      pNode.setAttribute('class', 'tree-node')
      const pSeq = document.createElement('div')
      pSeq.setAttribute('class', 'tree-sequent')
      pSeq.innerHTML = renderSchemaSequentHtml(p)
      pNode.appendChild(pSeq)
      premisesEl.appendChild(pNode)
    }
    node.appendChild(premisesEl)
  }

  const inference = document.createElement('div')
  inference.setAttribute('class', 'tree-inference')
  const label = document.createElement('div')
  label.setAttribute('class', 'tree-rule-label')
  label.textContent = schema.name
  inference.appendChild(label)
  node.appendChild(inference)

  const concSeq = document.createElement('div')
  concSeq.setAttribute('class', 'tree-sequent')
  concSeq.innerHTML = renderSchemaSequentHtml(schema.conclusion)
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

    const panel = document.createElement('div')
    panel.setAttribute('class', 'quiz-panel')

    // Back button
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

    // Question area: concrete derivation with rule name hidden
    const questionArea = document.createElement('div')
    questionArea.setAttribute('class', 'quiz-question')
    const derivEl = createDerivationEl(
      instance.premises,
      instance.conclusion,
      state.guessIndex !== null ? answer.name : null,
    )
    questionArea.appendChild(derivEl)
    panel.appendChild(questionArea)

    // Rule cards
    const cardsArea = document.createElement('div')
    cardsArea.setAttribute('class', 'quiz-cards')

    for (let i = 0; i < state.schemas.length; i += 1) {
      const schema = state.schemas[i]
      if (schema === undefined) continue
      const card = document.createElement('div')
      let cls = 'quiz-card'
      if (state.guessIndex !== null) {
        if (i === state.answerIndex) cls += ' quiz-card-correct'
        else if (i === state.guessIndex) cls += ' quiz-card-wrong'
      }
      card.setAttribute('class', cls)
      card.appendChild(createSchemaCardEl(schema))

      if (state.guessIndex !== null) {
        card.style.cursor = 'default'
      } else {
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
