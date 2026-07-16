import { RandomConfig, defaultRandomConfig } from '../random/config'
import {
  parseConfigFromParams,
  setConfigParams,
  buildFormulaSettingsSection,
  createNumberInput,
  createRow,
  createPreviewWorker,
  renderPreviewList,
  entryDistance,
  insertSorted,
  isDone,
  PreviewEntry,
  PreviewWorker,
} from './random-config'
import { MountResult, Navigate } from './types'
import { t, formatStats } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { ChallengeMessage } from './challenge-protocol'
import {
  NpcKnobs,
  defaultNpcKnobs,
  parseNpcKnobsFromParams,
  setNpcKnobsParams,
} from '../npc/knobs'

export type PlayerInput = 'mouse' | 'keyboard' | 'gamepad1' | 'gamepad2' | 'npc'

export type VersusConfig = {
  randomConfig: RandomConfig
  gameDurationSeconds: number
  p1Input: PlayerInput
  p2Input: PlayerInput
  npc1Knobs: NpcKnobs
  npc2Knobs: NpcKnobs
}

export const defaultVersusConfig = (): VersusConfig => ({
  randomConfig: defaultRandomConfig(),
  gameDurationSeconds: 300,
  p1Input: 'keyboard',
  p2Input: 'npc',
  npc1Knobs: defaultNpcKnobs(),
  npc2Knobs: defaultNpcKnobs(),
})

const INPUT_OPTIONS: PlayerInput[] = [
  'mouse',
  'keyboard',
  'gamepad1',
  'gamepad2',
  'npc',
]

const pickNumber = (
  params: URLSearchParams,
  key: string,
  fallback: number,
): number => {
  const raw = params.get(key)
  if (raw === null || raw === '') return fallback
  const value = parseInt(raw, 10)
  return Number.isFinite(value) ? value : fallback
}

const pickInput = (
  params: URLSearchParams,
  key: string,
  fallback: PlayerInput,
): PlayerInput => {
  const raw = params.get(key)
  if (
    raw === 'mouse' ||
    raw === 'keyboard' ||
    raw === 'gamepad1' ||
    raw === 'gamepad2' ||
    raw === 'npc'
  )
    return raw
  return fallback
}

export const parseVersusConfigFromParams = (
  params: URLSearchParams,
): VersusConfig => {
  const defaults = defaultVersusConfig()
  return {
    randomConfig: parseConfigFromParams(params),
    gameDurationSeconds: pickNumber(
      params,
      'versus_time',
      defaults.gameDurationSeconds,
    ),
    p1Input: pickInput(params, 'versus_p1', defaults.p1Input),
    p2Input: pickInput(params, 'versus_p2', defaults.p2Input),
    npc1Knobs: parseNpcKnobsFromParams(params, 'npc1_'),
    npc2Knobs: parseNpcKnobsFromParams(params, 'npc2_'),
  }
}

export const setVersusConfigParams = (
  config: VersusConfig,
  params: URLSearchParams,
): void => {
  setConfigParams(config.randomConfig, params)
  params.set('versus_time', String(config.gameDurationSeconds))
  params.set('versus_p1', config.p1Input)
  params.set('versus_p2', config.p2Input)
  setNpcKnobsParams(config.npc1Knobs, params, 'npc1_')
  setNpcKnobsParams(config.npc2Knobs, params, 'npc2_')
}

export const inputLabel = (input: PlayerInput): string => {
  if (input === 'mouse') return t('mouse')
  if (input === 'keyboard') return t('keyboard')
  if (input === 'gamepad1') return t('gamepad1')
  if (input === 'gamepad2') return t('gamepad2')
  return t('npc')
}

const inputEmoji = (input: PlayerInput): string => {
  if (input === 'mouse') return '🖱️'
  if (input === 'keyboard') return '⌨️'
  if (input === 'gamepad1') return '🎮₁'
  if (input === 'gamepad2') return '🎮₂'
  return '🤖'
}

const connectedGamepadCount = (): number =>
  Array.from(navigator.getGamepads()).filter((gp) => gp !== null).length

export const isInputAvailable = (input: PlayerInput): boolean => {
  if (input === 'mouse' || input === 'keyboard' || input === 'npc') return true
  const needed = input === 'gamepad1' ? 1 : 2
  return connectedGamepadCount() >= needed
}

export const mountVersusConfig = (
  container: HTMLElement,
  _navigate: Navigate,
  onStart: (config: VersusConfig) => void,
): MountResult => {
  const config = parseVersusConfigFromParams(
    new URLSearchParams(window.location.search),
  )

  const syncUrl = () => {
    const params = new URLSearchParams(window.location.search)
    setVersusConfigParams(config, params)
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
      const distance = entryDistance(nonStructuralCount, config.randomConfig)
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
    config.randomConfig,
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
    previewWorker = createPreviewWorker(config.randomConfig, handleResult)
    renderPreviewList(entries)
    startClock()
  }

  const canStart = (): boolean =>
    isInputAvailable(config.p1Input) && isInputAvailable(config.p2Input)

  const createRadioGroup = <T extends string | number>(
    options: T[],
    getActive: () => T,
    getLabel: (v: T) => string,
    getContent: (v: T) => string,
    isDisabled: (v: T) => boolean,
    onChange: (v: T) => void,
  ): HTMLElement => {
    const group = document.createElement('div')
    group.className = 'config-toggles'
    for (const option of options) {
      const btn = document.createElement('div')
      const active = getActive() === option
      const disabled = isDisabled(option)
      btn.className =
        'button' + (active ? ' active' : '') + (disabled ? ' disabled' : '')
      btn.textContent = getContent(option)
      btn.title = getLabel(option)
      btn.setAttribute('aria-label', getLabel(option))
      if (!disabled) {
        btn.onclick = () => {
          onChange(option)
          rerender()
        }
      }
      group.appendChild(btn)
    }
    return group
  }

  const rerender = () => {
    container.innerHTML = ''

    const layout = document.createElement('div')
    layout.className = 'random-config versus-config'

    layout.appendChild(createLangSwitcher())

    const title = document.createElement('div')
    title.className = 'config-title'
    title.textContent = t('versus')
    layout.appendChild(title)

    const columns = document.createElement('div')
    columns.className = 'config-columns'

    const settings = document.createElement('div')
    settings.className = 'config-settings'

    // Players section
    const inputSection = document.createElement('div')
    inputSection.className = 'config-section'
    const inputSectionTitle = document.createElement('div')
    inputSectionTitle.className = 'config-section-title'
    inputSectionTitle.textContent = t('players')
    inputSection.appendChild(inputSectionTitle)

    const p1Label = document.createElement('div')
    p1Label.className = 'config-subsection-title'
    p1Label.textContent = t('player1')
    inputSection.appendChild(p1Label)
    inputSection.appendChild(
      createRadioGroup(
        INPUT_OPTIONS,
        () => config.p1Input,
        inputLabel,
        inputEmoji,
        (v) => !isInputAvailable(v),
        (v) => {
          config.p1Input = v
          syncUrl()
        },
      ),
    )

    const p2Label = document.createElement('div')
    p2Label.className = 'config-subsection-title'
    p2Label.textContent = t('player2')
    inputSection.appendChild(p2Label)
    inputSection.appendChild(
      createRadioGroup(
        INPUT_OPTIONS,
        () => config.p2Input,
        inputLabel,
        inputEmoji,
        (v) => !isInputAvailable(v),
        (v) => {
          config.p2Input = v
          syncUrl()
        },
      ),
    )

    settings.appendChild(inputSection)

    // Back + Start buttons
    const buttons = document.createElement('div')
    buttons.className = 'config-buttons'

    const backBtn = document.createElement('div')
    backBtn.className = 'button'
    backBtn.textContent = t('back')
    backBtn.onclick = () => history.back()
    buttons.appendChild(backBtn)

    const startBtn = document.createElement('div')
    startBtn.className = 'button' + (canStart() ? '' : ' disabled')
    startBtn.textContent = t('start')
    if (canStart()) {
      startBtn.onclick = () => onStart(config)
    }
    buttons.appendChild(startBtn)

    settings.appendChild(buttons)

    settings.appendChild(
      buildFormulaSettingsSection(config.randomConfig, restartSearch, [
        createRow(
          t('matchLength'),
          createNumberInput(
            config.gameDurationSeconds / 60,
            (v) => {
              config.gameDurationSeconds = v * 60
              syncUrl()
            },
            1,
            99,
          ),
        ),
      ]),
    )
    columns.appendChild(settings)

    // Preview column
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

    layout.appendChild(columns)
    container.appendChild(layout)

    restartSearch()
  }

  const onGamepadChange = () => rerender()
  window.addEventListener('gamepadconnected', onGamepadChange)
  window.addEventListener('gamepaddisconnected', onGamepadChange)

  rerender()

  return {
    cleanup: () => {
      window.removeEventListener('gamepadconnected', onGamepadChange)
      window.removeEventListener('gamepaddisconnected', onGamepadChange)
      stopClock()
      if (previewWorker) {
        previewWorker.terminate()
        previewWorker = undefined
      }
    },
    rerender,
  }
}
