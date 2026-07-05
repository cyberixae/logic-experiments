import { GameMode, gameModes } from './model/mode'
import { Session } from './interactive/session'
import { Workspace, WorkspaceFactory } from './interactive/workspace'
import { challenges } from './challenges'
import { MountResult, Screen } from './web/types'
import { mountMenu } from './web/menu'
import { mountCampaign } from './web/campaign'
import { mountRandom } from './web/random'
import { mountSystem } from './web/system'
import { mountSecret } from './web/secret'
import { mountVersus } from './web/versus'
import { mountTutorial } from './web/tutorial'
import {
  mountVersusConfig,
  parseVersusConfigFromParams,
  setVersusConfigParams,
} from './web/versus-config'
import {
  mountRandomConfig,
  parseConfigFromParams,
  setConfigParams,
} from './web/random-config'
import { defaultRandomConfig } from './random/config'
import { setGazeModeActive } from './web/game'
import { onLocaleChange, setLocale } from './web/i18n'
import { ChallengePool } from './web/challenge-pool'
import { includes } from './utils/array'

const pool = new ChallengePool()

const session = new Session()

const factory: WorkspaceFactory = {
  campaign: () => new Workspace(challenges),
  random: () => new Workspace({ challenge: pool.take().challenge }),
}

let current: MountResult = { cleanup: () => {}, rerender: () => {} }

const enterMode = (mode: GameMode) => {
  session.enter(mode, factory[mode]())
}

const navigate = (screen: Screen) => {
  current.cleanup()
  if (screen === 'menu') {
    setGazeModeActive(false)
    session.returnToMenu()
  }
  if (screen === 'random') {
    pool.configure(defaultRandomConfig())
  }
  if (includes(gameModes, screen)) {
    enterMode(screen)
  }
  const currentParams = new URLSearchParams(window.location.search)
  const lang = currentParams.get('lang')
  const nextParams = new URLSearchParams()
  if (lang !== null) nextParams.set('lang', lang)
  let url: string
  if (screen === 'menu') {
    const qs = nextParams.toString()
    url = qs ? `?${qs}` : window.location.pathname
  } else {
    nextParams.set('mode', screen)
    if (screen === 'random-config') {
      for (const key of [
        'symbols',
        'connectives',
        'formula_size',
        'proof_size',
        'chaoticity',
      ]) {
        const val = currentParams.get(key)
        if (val !== null) nextParams.set(key, val)
      }
    }
    if (screen === 'versus-config' || screen === 'versus') {
      for (const key of [
        'symbols',
        'connectives',
        'formula_size',
        'proof_size',
        'chaoticity',
        'versus_time',
        'versus_p1',
        'versus_p2',
      ]) {
        const val = currentParams.get(key)
        if (val !== null) nextParams.set(key, val)
      }
    }
    url = `?${nextParams.toString()}`
  }
  history.pushState({ screen }, '', url)
  mount(screen)
}

const mount = (screen: Screen) => {
  const body = document.getElementById('body')
  if (!body) return
  switch (screen) {
    case 'menu':
      current = mountMenu(body, navigate)
      break
    case 'campaign':
      current = mountCampaign(body, navigate, session)
      break
    case 'random':
      current = mountRandom(body, navigate, session, () => {
        const ws = factory['random']()
        session.replaceWorkspace(ws)
      })
      break
    case 'secret':
      current = mountSecret(body, navigate)
      break
    case 'system':
      current = mountSystem(body, navigate)
      break
    case 'versus': {
      const vConfig = parseVersusConfigFromParams(
        new URLSearchParams(window.location.search),
      )
      pool.configure(vConfig.randomConfig)
      current = mountVersus(body, navigate, pool, vConfig)
      break
    }
    case 'tutorial': {
      const params = new URLSearchParams(window.location.search)
      const raw = parseInt(params.get('tutorial_notch') ?? '0', 10)
      const notch = Number.isFinite(raw) ? raw : 0
      current = mountTutorial(body, navigate, pool, notch)
      break
    }
    case 'versus-config':
      current = mountVersusConfig(body, navigate, (versusConfig) => {
        current.cleanup()
        pool.configure(versusConfig.randomConfig)
        const params = new URLSearchParams()
        const lang = new URLSearchParams(window.location.search).get('lang')
        if (lang !== null) params.set('lang', lang)
        params.set('mode', 'versus')
        setVersusConfigParams(versusConfig, params)
        history.pushState({ screen: 'versus' }, '', `?${params.toString()}`)
        mount('versus')
      })
      break
    case 'random-config':
      current = mountRandomConfig(body, navigate, (config) => {
        pool.configure(config)
        current.cleanup()
        enterMode('random')
        const params = new URLSearchParams()
        const lang = new URLSearchParams(window.location.search).get('lang')
        if (lang !== null) params.set('lang', lang)
        params.set('mode', 'random')
        setConfigParams(config, params)
        history.pushState({ screen: 'random' }, '', `?${params.toString()}`)
        mount('random')
      })
      break
  }
}

const init = () => {
  const params = new URLSearchParams(window.location.search)
  setLocale(params.get('lang'))
  onLocaleChange(() => current.rerender())
  const mode = params.get('mode')

  if (mode === 'campaign' || mode === 'random') {
    if (mode === 'random') {
      pool.configure(parseConfigFromParams(params))
    }
    enterMode(mode)
    mount(mode)
  } else if (mode === 'random-config') {
    mount('random-config')
  } else if (mode === 'secret') {
    mount('secret')
  } else if (mode === 'system') {
    mount('system')
  } else if (mode === 'versus') {
    mount('versus')
  } else if (mode === 'tutorial') {
    mount('tutorial')
  } else if (mode === 'versus-config') {
    mount('versus-config')
  } else if (params.get('level') !== null) {
    // Legacy URL: ?level=ch0identity1 — jump straight into campaign
    enterMode('campaign')
    mount('campaign')
  } else {
    mount('menu')
  }
  document.documentElement.classList.remove('loading')
}

document.addEventListener('DOMContentLoaded', init)

window.addEventListener('popstate', (event) => {
  current.cleanup()
  const screen: Screen = event.state?.screen ?? 'menu'
  if (screen === 'menu') {
    setGazeModeActive(false)
    session.returnToMenu()
  }
  if (includes(gameModes, screen)) {
    enterMode(screen)
  }
  mount(screen)
})
