import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { fromAtom, basic } from '../render/print'
import { html } from '../render/segment'
import { atom } from '../model/prop'
import {
  QuizConfig,
  ALL_SYMBOLS,
  ALL_CONNECTIVE_TYPES,
  ALL_VARIABLES,
  ALL_SEQUENCES,
  parseQuizConfigFromParams,
  setQuizConfigParams,
} from '../quiz/config'

const ALL_PREMISE_COUNTS = [0, 1, 2] as const

const renderAtom = (name: string): string => html(fromAtom(atom(name))(basic))

const createToggle = (
  content: string,
  useHtml: boolean,
  title: string,
  isActive: () => boolean,
  onToggle: () => void,
): HTMLElement => {
  const btn = document.createElement('pre')
  btn.className = 'button toggle'
  if (useHtml) {
    btn.innerHTML = content
  } else {
    btn.textContent = content
  }
  btn.title = title
  const led = document.createElement('span')
  led.className = 'led' + (isActive() ? ' on' : '')
  btn.appendChild(led)
  btn.onclick = () => {
    onToggle()
    led.className = 'led' + (isActive() ? ' on' : '')
    syncUrl()
  }
  return btn
}

const createNumberInput = (
  value: number,
  onChange: (v: number) => void,
  min: number = 0,
  max: number = 10,
): HTMLElement => {
  const input = document.createElement('input')
  input.type = 'number'
  input.className = 'config-input'
  input.value = String(value)
  input.min = String(min)
  input.max = String(max)
  input.step = '1'
  input.onchange = () => {
    const parsed = parseInt(input.value, 10)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed)
      syncUrl()
    }
  }
  return input
}

const createRow = (label: string, input: HTMLElement): HTMLElement => {
  const row = document.createElement('div')
  row.className = 'config-row'
  const labelEl = document.createElement('label')
  labelEl.className = 'config-label'
  labelEl.textContent = label
  row.appendChild(labelEl)
  row.appendChild(input)
  return row
}

const createSection = (title: string): HTMLElement => {
  const section = document.createElement('div')
  section.className = 'config-section'
  const heading = document.createElement('div')
  heading.className = 'config-section-title'
  heading.textContent = title
  section.appendChild(heading)
  return section
}

let syncUrl = () => {}

export const mountQuizConfig = (
  container: HTMLElement,
  navigate: Navigate,
  onStart: (config: QuizConfig) => void,
): MountResult => {
  const config = parseQuizConfigFromParams(
    new URLSearchParams(window.location.search),
  )

  syncUrl = () => {
    const params = new URLSearchParams(window.location.search)
    setQuizConfigParams(config, params)
    history.replaceState(history.state, '', `?${params.toString()}`)
  }

  const toggle = (arr: string[], value: string) => {
    const idx = arr.indexOf(value)
    if (idx === -1) {
      arr.push(value)
    } else {
      arr.splice(idx, 1)
    }
  }

  const render = () => {
    container.innerHTML = ''

    const layout = document.createElement('div')
    layout.className = 'random-config'

    layout.appendChild(createLangSwitcher())

    const title = document.createElement('div')
    title.className = 'config-title'
    title.textContent = t('quiz')
    layout.appendChild(title)

    const settings = document.createElement('div')
    settings.className = 'config-settings'

    // Symbols
    const symbolSection = createSection(t('symbols'))
    const symbolToggles = document.createElement('div')
    symbolToggles.className = 'config-toggles'
    for (const s of ALL_SYMBOLS) {
      symbolToggles.appendChild(
        createToggle(
          renderAtom(s),
          true,
          s,
          () => config.symbols.includes(s),
          () => toggle(config.symbols, s),
        ),
      )
    }
    symbolSection.appendChild(symbolToggles)
    settings.appendChild(symbolSection)

    // Connectives
    const connLabel: Record<string, string> = {
      negation: '¬',
      implication: '→',
      conjunction: '∧',
      disjunction: '∨',
      falsum: '⊥',
      verum: '⊤',
    }
    const connSection = createSection(t('connectives'))
    const connToggles = document.createElement('div')
    connToggles.className = 'config-toggles'
    for (const c of ALL_CONNECTIVE_TYPES) {
      connToggles.appendChild(
        createToggle(
          connLabel[c] ?? c,
          false,
          c,
          () => config.connectives.includes(c),
          () => toggle(config.connectives, c),
        ),
      )
    }
    connSection.appendChild(connToggles)
    settings.appendChild(connSection)

    // Formula variables
    const varSection = createSection(t('variables'))
    const varToggles = document.createElement('div')
    varToggles.className = 'config-toggles'
    for (const v of ALL_VARIABLES) {
      varToggles.appendChild(
        createToggle(
          v,
          false,
          v,
          () => config.variables.includes(v),
          () => toggle(config.variables, v),
        ),
      )
    }
    varSection.appendChild(varToggles)
    settings.appendChild(varSection)

    // Sequence symbols
    const seqSection = createSection(t('sequences'))
    const seqToggles = document.createElement('div')
    seqToggles.className = 'config-toggles'
    for (const s of ALL_SEQUENCES) {
      seqToggles.appendChild(
        createToggle(
          s,
          false,
          s,
          () => config.sequences.includes(s),
          () => toggle(config.sequences, s),
        ),
      )
    }
    seqSection.appendChild(seqToggles)
    settings.appendChild(seqSection)

    // Premises
    const premisesSection = createSection(t('premises'))
    const premisesToggles = document.createElement('div')
    premisesToggles.className = 'config-toggles'
    for (const n of ALL_PREMISE_COUNTS) {
      premisesToggles.appendChild(
        createToggle(
          String(n),
          false,
          String(n),
          () => config.premiseCounts.includes(n),
          () => {
            const idx = config.premiseCounts.indexOf(n)
            if (idx === -1) config.premiseCounts.push(n)
            else config.premiseCounts.splice(idx, 1)
          },
        ),
      )
    }
    premisesSection.appendChild(premisesToggles)
    settings.appendChild(premisesSection)

    // Formula size and context size
    const sizeSection = createSection(t('size'))
    sizeSection.appendChild(
      createRow(
        t('size'),
        createNumberInput(config.formulaSize, (v) => {
          config.formulaSize = v
        }),
      ),
    )
    sizeSection.appendChild(
      createRow(
        t('contextSize'),
        createNumberInput(config.contextSize, (v) => { config.contextSize = v }, 1, 6),
      ),
    )
    settings.appendChild(sizeSection)

    // Buttons
    const buttons = document.createElement('div')
    buttons.className = 'config-buttons'
    const backBtn = document.createElement('div')
    backBtn.className = 'button'
    backBtn.textContent = t('back')
    backBtn.onclick = () => navigate('menu')
    buttons.appendChild(backBtn)
    const startBtn = document.createElement('div')
    startBtn.className = 'button'
    startBtn.textContent = t('start')
    startBtn.onclick = () => onStart(config)
    buttons.appendChild(startBtn)
    settings.appendChild(buttons)

    layout.appendChild(settings)
    container.appendChild(layout)
  }

  render()

  return { cleanup: () => {}, rerender: render }
}
