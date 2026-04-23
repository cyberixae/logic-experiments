import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { fromAtom, fromSequent, basic } from '../render/print'
import { Prop } from '../model/prop'
import { plain, html } from '../render/segment'
import { treeAuto } from '../render/block'
import { atom } from '../model/prop'
import { sequent } from '../model/sequent'
import {
  QuizConfig,
  ALL_SYMBOLS,
  ALL_INSTANCE_SYMBOLS,
  ALL_CONNECTIVE_TYPES,
  ALL_VARIABLES,
  ALL_SEQUENCES,
  parseQuizConfigFromParams,
  setQuizConfigParams,
  PRESETS,
  matchPreset,
} from '../quiz/config'
import { fromSchemaRule } from '../quiz/render'
import { RuleSchema } from '../quiz/schema'
import { generatePreviewSchemas, instantiate } from '../quiz/generate'

const ALL_PREMISE_COUNTS = [0, 1, 2] as const

const emptySequent = { antecedent: [], succedent: [] }

const premiseCountShape = (n: number): string => {
  const schema: RuleSchema = {
    name: '',
    premises: Array.from({ length: n }, () => emptySequent),
    conclusion: emptySequent,
  }
  return fromSchemaRule(schema, false)
}

const renderAtom = (name: string): string => html(fromAtom(atom(name))(basic))

const sequentText = (ant: Prop[], suc: Prop[]): string =>
  plain(fromSequent(sequent(ant, suc))(basic))

const fromInstanceRule = (schema: RuleSchema, formulaSize: number, sequenceSize: number, connectives: string[], symbols: string[]): string => {
  const inst = instantiate(schema, formulaSize, sequenceSize, connectives, symbols)
  return treeAuto(
    sequentText(inst.conclusion.antecedent, inst.conclusion.succedent),
    inst.premises.map((p) => sequentText(p.antecedent, p.succedent)),
    null,
  )
}

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
  heading.className = 'config-subsection-title'
  heading.textContent = title
  section.appendChild(heading)
  return section
}

let syncUrl = () => {}
let renderPreview = () => {}

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
    renderPreview()
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

    const columns = document.createElement('div')
    columns.className = 'config-columns'

    const settings = document.createElement('div')
    settings.className = 'config-settings'

    // Rule settings section
    const ruleSection = document.createElement('div')
    ruleSection.className = 'config-section'

    const ruleTitle = document.createElement('div')
    ruleTitle.className = 'config-section-title'
    ruleTitle.textContent = t('ruleSettings')
    ruleSection.appendChild(ruleTitle)

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
    ruleSection.appendChild(symbolSection)

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
    ruleSection.appendChild(connSection)

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
    ruleSection.appendChild(varSection)

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
    ruleSection.appendChild(seqSection)

    // Formula size and context size
    const sizeSection = createSection(t('size'))
    sizeSection.appendChild(
      createRow(
        t('size'),
        createNumberInput(config.formulaSize, (v) => { config.formulaSize = v }),
      ),
    )
    sizeSection.appendChild(
      createRow(
        t('contextSize'),
        createNumberInput(config.contextSize, (v) => { config.contextSize = v }, 0, 6),
      ),
    )
    ruleSection.appendChild(sizeSection)

    settings.appendChild(ruleSection)

    // Preset selector
    const presetSection = document.createElement('div')
    presetSection.className = 'config-section'
    const presetTitle = document.createElement('div')
    presetTitle.className = 'config-section-title'
    presetTitle.textContent = t('presets')
    presetSection.appendChild(presetTitle)
    const presetToggles = document.createElement('div')
    presetToggles.className = 'config-toggles preset-toggles'
    const activePreset = matchPreset(config)
    for (let i = 0; i < PRESETS.length; i++) {
      const idx = i
      const btn = document.createElement('pre')
      btn.className = 'button' + (activePreset === idx ? ' active' : '')
      btn.textContent = String(idx)
      btn.onclick = () => { Object.assign(config, PRESETS[idx]); syncUrl(); render() }
      presetToggles.appendChild(btn)
    }
    presetSection.appendChild(presetToggles)
    settings.insertBefore(presetSection, ruleSection)

    // Premises section (standalone, before rule settings)
    const premisesTopSection = document.createElement('div')
    premisesTopSection.className = 'config-section'
    const premisesTitle = document.createElement('div')
    premisesTitle.className = 'config-section-title'
    premisesTitle.textContent = t('premises')
    premisesTopSection.appendChild(premisesTitle)
    const premisesToggles = document.createElement('div')
    premisesToggles.className = 'config-toggles'
    for (const n of ALL_PREMISE_COUNTS) {
      const btn = createToggle(
        premiseCountShape(n),
        false,
        String(n),
        () => config.premiseCounts.includes(n),
        () => {
          const idx = config.premiseCounts.indexOf(n)
          if (idx === -1) config.premiseCounts.push(n)
          else config.premiseCounts.splice(idx, 1)
        },
      )
      btn.classList.add('toggle-large')
      premisesToggles.appendChild(btn)
    }
    premisesTopSection.appendChild(premisesToggles)
    settings.insertBefore(premisesTopSection, ruleSection)

    // Instantiation settings section
    const instSection = document.createElement('div')
    instSection.className = 'config-section'

    const instTitle = document.createElement('div')
    instTitle.className = 'config-section-title'
    instTitle.textContent = t('instantiationSettings')
    instSection.appendChild(instTitle)

    const instSymbolSection = createSection(t('symbols'))
    const instSymbolToggles = document.createElement('div')
    instSymbolToggles.className = 'config-toggles'
    for (const s of ALL_INSTANCE_SYMBOLS) {
      instSymbolToggles.appendChild(
        createToggle(
          renderAtom(s),
          true,
          s,
          () => config.instanceSymbols.includes(s),
          () => toggle(config.instanceSymbols, s),
        ),
      )
    }
    instSymbolSection.appendChild(instSymbolToggles)
    instSection.appendChild(instSymbolSection)

    const instConnLabel: Record<string, string> = {
      negation: '¬',
      implication: '→',
      conjunction: '∧',
      disjunction: '∨',
      falsum: '⊥',
      verum: '⊤',
    }
    const instConnSection = createSection(t('connectives'))
    const instConnToggles = document.createElement('div')
    instConnToggles.className = 'config-toggles'
    for (const c of ALL_CONNECTIVE_TYPES) {
      instConnToggles.appendChild(
        createToggle(
          instConnLabel[c] ?? c,
          false,
          c,
          () => config.instanceConnectives.includes(c),
          () => toggle(config.instanceConnectives, c),
        ),
      )
    }
    instConnSection.appendChild(instConnToggles)
    instSection.appendChild(instConnSection)

    const instSizeSection = createSection(t('size'))
    instSizeSection.appendChild(
      createRow(
        t('size'),
        createNumberInput(config.instanceFormulaSize, (v) => { config.instanceFormulaSize = v }),
      ),
    )
    instSizeSection.appendChild(
      createRow(
        t('sequenceSize'),
        createNumberInput(config.instanceSequenceSize, (v) => { config.instanceSequenceSize = v }, 0, 6),
      ),
    )
    instSection.appendChild(instSizeSection)

    settings.appendChild(instSection)

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

    columns.appendChild(settings)

    // Preview column
    const previewCol = document.createElement('div')
    previewCol.className = 'config-preview'

    const previewTitle = document.createElement('div')
    previewTitle.className = 'config-section-title'
    previewTitle.textContent = t('preview')
    previewCol.appendChild(previewTitle)

    const previewCards = document.createElement('div')
    previewCards.className = 'preview-rows'
    previewCol.appendChild(previewCards)

    renderPreview = () => {
      previewCards.innerHTML = ''
      const schemas = generatePreviewSchemas(config, 6)
      for (const schema of schemas) {
        const row = document.createElement('div')
        row.className = 'preview-row'

        const schemaCard = document.createElement('pre')
        schemaCard.className = 'quiz-card rule hint'
        schemaCard.innerHTML =
          '<span class="rule-label long">' + fromSchemaRule(schema, false) + '</span>' +
          '<span class="rule-label short">' + fromSchemaRule(schema, false) + '</span>'
        row.appendChild(schemaCard)

        for (let i = 0; i < 1; i++) {
          const instCard = document.createElement('pre')
          instCard.className = 'quiz-card rule'
          const text = fromInstanceRule(schema, config.instanceFormulaSize, config.instanceSequenceSize, config.instanceConnectives, config.instanceSymbols)
          instCard.textContent = text
          row.appendChild(instCard)
        }

        previewCards.appendChild(row)
      }
    }
    renderPreview()

    columns.appendChild(previewCol)
    layout.appendChild(columns)
    container.appendChild(layout)
  }

  render()

  return { cleanup: () => {}, rerender: render }
}
