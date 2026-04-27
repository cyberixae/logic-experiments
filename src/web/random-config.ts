import {
  RandomConfig,
  ConnectiveWeights,
  SymbolWeights,
  defaultRandomConfig,
} from '../random/config'

const pickNumber = (
  params: URLSearchParams,
  key: string,
  fallback: number,
): number => {
  const raw = params.get(key)
  if (raw === null || raw === '') return fallback
  const value = parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

const atomKeys: ReadonlyArray<keyof SymbolWeights> = [
  'p',
  'q',
  'r',
  's',
  'u',
  'v',
]

export const parseConfigFromParams = (
  params: URLSearchParams,
): RandomConfig => {
  const defaults = defaultRandomConfig()
  const symbolsParam = params.get('symbols')
  const connectivesParam = params.get('connectives')
  const symbols = { ...defaults.symbols }
  if (symbolsParam !== null) {
    for (const key of atomKeys) {
      symbols[key] = symbolsParam.includes(key) ? defaults.symbols[key] : 0
    }
  }
  if (connectivesParam !== null) {
    symbols.falsum = connectivesParam.includes('f')
      ? defaults.symbols.falsum
      : 0
    symbols.verum = connectivesParam.includes('v') ? defaults.symbols.verum : 0
  }
  const connectives = { ...defaults.connectives }
  if (connectivesParam !== null) {
    connectives.implication = connectivesParam.includes('i')
      ? defaults.connectives.implication
      : 0
    connectives.conjunction = connectivesParam.includes('c')
      ? defaults.connectives.conjunction
      : 0
    connectives.disjunction = connectivesParam.includes('d')
      ? defaults.connectives.disjunction
      : 0
    connectives.negation = connectivesParam.includes('n')
      ? defaults.connectives.negation
      : 0
  }
  return {
    size: pickNumber(params, 'formula_size', defaults.size),
    targetNonStructural: pickNumber(
      params,
      'proof_size',
      defaults.targetNonStructural,
    ),
    bypassPercent: pickNumber(params, 'chaoticity', defaults.bypassPercent),
    connectives,
    symbols,
  }
}

export const setConfigParams = (
  config: RandomConfig,
  params: URLSearchParams,
): void => {
  const symbols = atomKeys.filter((k) => config.symbols[k] > 0).join('')
  const connectives = [
    config.connectives.implication > 0 ? 'i' : '',
    config.connectives.conjunction > 0 ? 'c' : '',
    config.connectives.disjunction > 0 ? 'd' : '',
    config.connectives.negation > 0 ? 'n' : '',
    config.symbols.falsum > 0 ? 'f' : '',
    config.symbols.verum > 0 ? 'v' : '',
  ].join('')
  params.set('symbols', symbols)
  params.set('connectives', connectives)
  params.set('formula_size', String(config.size))
  params.set(
    'proof_size',
    config.targetNonStructural === Infinity
      ? ''
      : String(config.targetNonStructural),
  )
  params.set('chaoticity', String(config.bypassPercent))
}
import { MountResult, Navigate } from './types'
import { t, formatStats } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import * as prop from '../model/prop'
import { fromProp, fromAtom, basic } from '../render/print'
import { html } from '../render/segment'
import {
  ChallengeMessage,
  ControlMessage,
  serializeConfig,
} from './challenge-protocol'

const TARGET_COUNT = 10

type PreviewEntry = {
  formula: prop.Prop
  nonStructural: number
  distance: number
}

const entryDistance = (nonStructural: number, config: RandomConfig): number => {
  const diff = nonStructural - config.targetNonStructural
  if (diff === 0) return 0
  // Prefer above target over below: 8, 9, 7, 10, 6, ...
  return diff > 0 ? diff * 2 - 1 : -diff * 2
}

const insertSorted = (
  entries: Array<PreviewEntry>,
  entry: PreviewEntry,
): Array<PreviewEntry> => {
  const result = [...entries]
  const idx = result.findIndex((e) => e.distance > entry.distance)
  if (idx === -1) {
    result.push(entry)
  } else {
    result.splice(idx, 0, entry)
  }
  return result.slice(0, TARGET_COUNT)
}

const isDone = (entries: Array<PreviewEntry>): boolean =>
  entries.length >= TARGET_COUNT && entries.every((e) => e.distance === 0)

const renderAtom = (name: string): string =>
  html(fromAtom(prop.atom(name))(basic))

const renderFormula = (p: prop.Prop): string => {
  const segments = fromProp(p)(basic)
  return html(segments)
}

type PreviewWorker = {
  configure: (config: RandomConfig) => void
  updateTimeout: (bufferSize: number) => void
  terminate: () => void
}

const timeoutForBuffer = (bufferSize: number): number => {
  if (bufferSize === 0) return 30000
  if (bufferSize < 5) return 10000
  return 2000
}

const createPreviewWorker = (
  config: RandomConfig,
  onResult: (msg: ChallengeMessage) => void,
): PreviewWorker => {
  const worker = new Worker('lk.w.js')
  worker.onmessage = (e: MessageEvent<ChallengeMessage>) => {
    onResult(e.data)
  }

  const send = (msg: ControlMessage) => {
    worker.postMessage(msg)
  }

  const workerConfig = (): RandomConfig => ({
    ...config,
    bypassPercent: 0,
    targetNonStructural: Infinity,
  })

  send({ type: 'configure', config: serializeConfig(workerConfig()) })
  send({ type: 'timeout', ms: timeoutForBuffer(0) })
  send({ type: 'resume' })

  return {
    configure: (newConfig: RandomConfig) => {
      config = newConfig
      send({ type: 'pause' })
      send({
        type: 'configure',
        config: serializeConfig(workerConfig()),
      })
      send({ type: 'timeout', ms: timeoutForBuffer(0) })
      send({ type: 'resume' })
    },
    updateTimeout: (bufferSize: number) => {
      send({ type: 'timeout', ms: timeoutForBuffer(bufferSize) })
    },
    terminate: () => {
      worker.terminate()
    },
  }
}

const renderPreviewList = (entries: Array<PreviewEntry>): void => {
  const list = document.querySelector('.config-preview-list')
  if (!list) return
  list.innerHTML = ''
  for (const entry of entries) {
    const item = document.createElement('div')
    item.className =
      'config-preview-item' + (entry.distance > 0 ? ' approximate' : '')
    const count = document.createElement('span')
    count.className = 'config-preview-count'
    count.textContent = String(entry.nonStructural)
    item.appendChild(count)
    const formula = document.createElement('span')
    formula.innerHTML = renderFormula(entry.formula)
    item.appendChild(formula)
    list.appendChild(item)
  }
}

const createNumberInput = (
  value: number,
  onChange: (v: number) => void,
  min: number = 0,
  max?: number,
  step: number = 1,
  placeholder?: string,
): HTMLInputElement => {
  const input = document.createElement('input')
  input.type = 'number'
  input.className = 'config-input'
  input.min = String(min)
  if (max !== undefined) input.max = String(max)
  input.step = String(step)
  if (value === Infinity) {
    input.value = ''
    input.placeholder = placeholder ?? ''
  } else {
    input.value = String(value)
  }
  input.onchange = () => {
    const parsed = parseFloat(input.value)
    if (input.value === '') {
      onChange(Infinity)
    } else if (!isNaN(parsed)) {
      onChange(parsed)
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

export const mountRandomConfig = (
  container: HTMLElement,
  _navigate: Navigate,
  onStart: (config: RandomConfig) => void,
): MountResult => {
  const config = parseConfigFromParams(
    new URLSearchParams(window.location.search),
  )

  const syncUrl = () => {
    const params = new URLSearchParams(window.location.search)
    setConfigParams(config, params)
    history.replaceState(history.state, '', `?${params.toString()}`)
  }
  let entries: Array<PreviewEntry> = []
  let totalFormulasTried = 0
  let totalTautologiesFound = 0
  let totalSolved = 0
  let searchStartTime = Date.now()
  let lastWorkerUpdate = Date.now()
  let clockInterval: ReturnType<typeof setInterval> | undefined

  const updateStats = () => {
    const el = document.querySelector('.config-stats')
    if (!el) return
    const now = Date.now()
    const elapsed = (now - searchStartTime) / 1000
    const rate = elapsed > 0 ? totalFormulasTried / elapsed : 0
    const sinceUpdate = ((now - lastWorkerUpdate) / 1000).toFixed(1)
    el.textContent = formatStats({
      formulas: totalFormulasTried,
      rate: rate.toFixed(1),
      tautologies: totalTautologiesFound,
      solved: totalSolved,
      sinceUpdate,
    })
  }

  const startClock = () => {
    stopClock()
    clockInterval = setInterval(updateStats, 200)
  }

  const stopClock = () => {
    if (clockInterval !== undefined) {
      clearInterval(clockInterval)
      clockInterval = undefined
    }
  }

  const handleResult = (msg: ChallengeMessage) => {
    lastWorkerUpdate = Date.now()
    if (msg.type === 'stats') {
      totalFormulasTried += msg.formulasTried
      totalTautologiesFound += msg.tautologiesFound
      totalSolved += msg.solved
      updateStats()
      return
    }

    if (msg.type === 'challenge') {
      totalFormulasTried += msg.result.formulasTried
      updateStats()

      if (isDone(entries)) return

      const { challenge, nonStructuralCount } = msg.result
      const formula = challenge.goal.succedent[0]
      if (formula === undefined) return
      const distance = entryDistance(nonStructuralCount, config)
      const entry: PreviewEntry = {
        formula,
        nonStructural: nonStructuralCount,
        distance,
      }
      entries = insertSorted(entries, entry)
      renderPreviewList(entries)
      previewWorker?.updateTimeout(entries.length)

      if (isDone(entries) && previewWorker) {
        previewWorker.terminate()
        previewWorker = undefined
        stopClock()
      }
    }
  }

  let previewWorker: PreviewWorker | undefined = createPreviewWorker(
    config,
    handleResult,
  )

  const restartSearch = () => {
    syncUrl()
    entries = []
    totalFormulasTried = 0
    totalTautologiesFound = 0
    totalSolved = 0
    searchStartTime = Date.now()
    lastWorkerUpdate = Date.now()
    if (previewWorker) previewWorker.terminate()
    previewWorker = createPreviewWorker(config, handleResult)
    renderPreviewList(entries)
    startClock()
  }

  const onInputChange = (setter: (v: number) => void) => (v: number) => {
    setter(v)
    restartSearch()
  }

  const rerender = () => {
    container.innerHTML = ''

    const layout = document.createElement('div')
    layout.className = 'random-config'

    layout.appendChild(createLangSwitcher())

    const title = document.createElement('div')
    title.className = 'config-title'
    title.textContent = t('randomConfig')
    layout.appendChild(title)

    const columns = document.createElement('div')
    columns.className = 'config-columns'

    // Left column: settings
    const settings = document.createElement('div')
    settings.className = 'config-settings'

    // Formula shape section
    const shapeSection = createSection(t('formulaShape'))

    // Connective toggles
    const connectiveHeading = document.createElement('div')
    connectiveHeading.className = 'config-subsection-title'
    connectiveHeading.textContent = t('connectives')
    shapeSection.appendChild(connectiveHeading)

    const defaultConnectives = defaultRandomConfig().connectives
    const connectiveKeys: Array<{
      key: keyof ConnectiveWeights
      label: string
      symbol: string
    }> = [
      { key: 'implication', label: t('implicationWeight'), symbol: '\u2192' },
      { key: 'conjunction', label: t('conjunctionWeight'), symbol: '\u2227' },
      { key: 'disjunction', label: t('disjunctionWeight'), symbol: '\u2228' },
      { key: 'negation', label: t('negationWeight'), symbol: '\u00AC' },
    ]

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
        restartSearch()
      }
      return btn
    }

    const connectiveToggles = document.createElement('div')
    connectiveToggles.className = 'config-toggles'
    for (const { key, label, symbol } of connectiveKeys) {
      connectiveToggles.appendChild(
        createToggle(
          symbol,
          false,
          label,
          () => config.connectives[key] > 0,
          () => {
            config.connectives[key] =
              config.connectives[key] > 0 ? 0 : defaultConnectives[key]
          },
        ),
      )
    }

    const defaultSymbols = defaultRandomConfig().symbols
    const constantKeys: Array<{ key: keyof SymbolWeights; symbol: string }> = [
      { key: 'falsum', symbol: '\u22A5' },
      { key: 'verum', symbol: '\u22A4' },
    ]
    for (const { key, symbol } of constantKeys) {
      connectiveToggles.appendChild(
        createToggle(
          symbol,
          false,
          symbol,
          () => config.symbols[key] > 0,
          () => {
            config.symbols[key] =
              config.symbols[key] > 0 ? 0 : defaultSymbols[key]
          },
        ),
      )
    }
    shapeSection.appendChild(connectiveToggles)

    // Symbol toggles
    const symbolHeading = document.createElement('div')
    symbolHeading.className = 'config-subsection-title'
    symbolHeading.textContent = t('symbols')
    shapeSection.appendChild(symbolHeading)

    const symbolKeys: Array<keyof SymbolWeights> = [
      'p',
      'q',
      'r',
      's',
      'u',
      'v',
    ]

    const symbolToggles = document.createElement('div')
    symbolToggles.className = 'config-toggles'
    for (const key of symbolKeys) {
      symbolToggles.appendChild(
        createToggle(
          renderAtom(key),
          true,
          key,
          () => config.symbols[key] > 0,
          () => {
            config.symbols[key] =
              config.symbols[key] > 0 ? 0 : defaultSymbols[key]
          },
        ),
      )
    }
    shapeSection.appendChild(symbolToggles)

    settings.appendChild(shapeSection)

    // Parameters subsection
    const filterHeading = document.createElement('div')
    filterHeading.className = 'config-subsection-title'
    filterHeading.textContent = t('filter')
    shapeSection.appendChild(filterHeading)

    shapeSection.appendChild(
      createRow(
        t('size'),
        createNumberInput(
          config.size,
          onInputChange((v) => {
            config.size = v
          }),
          1,
          30,
        ),
      ),
    )

    shapeSection.appendChild(
      createRow(
        t('targetNonStructural'),
        createNumberInput(
          config.targetNonStructural,
          onInputChange((v) => {
            config.targetNonStructural = v
          }),
          1,
        ),
      ),
    )

    shapeSection.appendChild(
      createRow(
        t('bypassPercent'),
        createNumberInput(
          config.bypassPercent,
          onInputChange((v) => {
            config.bypassPercent = v
          }),
          0,
          100,
        ),
      ),
    )

    // Buttons
    const buttons = document.createElement('div')
    buttons.className = 'config-buttons'

    const backBtn = document.createElement('div')
    backBtn.className = 'button'
    backBtn.textContent = t('back')
    backBtn.onclick = () => history.back()
    buttons.appendChild(backBtn)

    const startBtn = document.createElement('div')
    startBtn.className = 'button'
    startBtn.textContent = t('start')
    startBtn.onclick = () => onStart(config)
    buttons.appendChild(startBtn)

    settings.appendChild(buttons)
    columns.appendChild(settings)

    // Middle column: formula listing
    const preview = document.createElement('div')
    preview.className = 'config-preview'

    const previewTitle = document.createElement('div')
    previewTitle.className = 'config-section-title'
    previewTitle.textContent = t('preview')
    preview.appendChild(previewTitle)

    const stats = document.createElement('div')
    stats.className = 'config-stats'
    preview.appendChild(stats)

    const list = document.createElement('div')
    list.className = 'config-preview-list'
    preview.appendChild(list)

    columns.appendChild(preview)

    // Right column: proof tree

    layout.appendChild(columns)
    container.appendChild(layout)

    restartSearch()
  }

  rerender()

  const cleanup = () => {
    stopClock()
    if (previewWorker) {
      previewWorker.terminate()
      previewWorker = undefined
    }
  }

  return { cleanup, rerender }
}
