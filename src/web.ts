import { GameMode, gameModes } from './model/mode'
import { repl, WorkspaceFactory } from './interactive/repl'
import { Session } from './interactive/session'
import { Workspace } from './interactive/workspace'
import { challenges } from './challenges'
import { MountResult, Screen } from './web/types'
import { mountMenu } from './web/menu'
import { mountCampaign } from './web/campaign'
import { mountRandom } from './web/random'
import { mountQuiz } from './web/quiz'
import { mountQuizConfig } from './web/quiz-config'
import { mountMatchIntro } from './web/match-intro'
import { mountMatchCurated } from './web/match-curated'
import { parseQuizConfigFromParams, setQuizConfigParams } from './quiz/config'
import { mountSystem } from './web/system'
import { mountSecret } from './web/secret'
import {
  mountRandomConfig,
  parseConfigFromParams,
  setConfigParams,
} from './web/random-config'
import { setGazeModeActive } from './web/game'
import { onLocaleChange, setLocale } from './web/i18n'
import { ChallengePool } from './web/challenge-pool'
import { plain } from './render/segment'
import { includes } from './utils/array'

const pool = new ChallengePool()

const session = new Session()

const factory: WorkspaceFactory = {
  campaign: () => new Workspace(challenges),
  random: () => new Workspace({ challenge: pool.take().challenge }),
  match: () => new Workspace(challenges),
}

const gen = repl(session, factory)
gen.next('')

let current: MountResult = { cleanup: () => {}, rerender: () => {} }
let currentScreen: Screen = 'menu'

const enterMode = (mode: GameMode) => {
  session.enter(mode, factory[mode]())
}

const screenForSession = (): Screen => session.mode ?? 'menu'

const navigate = (screen: Screen) => {
  current.cleanup()
  if (screen === 'menu') {
    setGazeModeActive(false)
    session.returnToMenu()
  }
  if (includes(gameModes, screen) && screen !== 'match') {
    enterMode(screen)
  }
  currentScreen = screen
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
    if (screen === 'random' || screen === 'random-config') {
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
    if (screen === 'match' || screen === 'match-config') {
      for (const key of [
        'qsymbols',
        'qconnectives',
        'qvariables',
        'qsequences',
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
    case 'match': {
      const qConfig = parseQuizConfigFromParams(
        new URLSearchParams(window.location.search),
      )
      current = mountQuiz(body, navigate, qConfig)
      break
    }
    case 'match-config':
      current = mountQuizConfig(body, navigate, (config) => {
        current.cleanup()
        currentScreen = 'match'
        const params = new URLSearchParams()
        const lang = new URLSearchParams(window.location.search).get('lang')
        if (lang !== null) params.set('lang', lang)
        params.set('mode', 'match')
        setQuizConfigParams(config, params)
        history.pushState({ screen: 'match' }, '', `?${params.toString()}`)
        mount('match')
      })
      break
    case 'match-intro':
      current = mountMatchIntro(body, navigate)
      break
    case 'match-curated':
      current = mountMatchCurated(body, navigate)
      break
    case 'random-config':
      current = mountRandomConfig(body, navigate, (config) => {
        pool.configure(config)
        current.cleanup()
        currentScreen = 'random'
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

const syncScreen = () => {
  const expected = screenForSession()
  if (expected === currentScreen) return
  current.cleanup()
  if (expected === 'menu') setGazeModeActive(false)
  currentScreen = expected
  const lang = new URLSearchParams(window.location.search).get('lang')
  const langSuffix = lang !== null ? `&lang=${encodeURIComponent(lang)}` : ''
  const menuUrl =
    lang !== null
      ? `${window.location.pathname}?lang=${encodeURIComponent(lang)}`
      : window.location.pathname
  history.pushState(
    { screen: expected },
    '',
    expected === 'menu' ? menuUrl : `?mode=${expected}${langSuffix}`,
  )
  mount(expected)
}

const cmd = (input: string) => {
  const result = gen.next(input)
  console.log(plain(result.value))
  syncScreen()
  current.rerender()
}
Object.assign(window, { cmd })

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
    currentScreen = mode
    mount(mode)
  } else if (mode === 'random-config') {
    currentScreen = 'random-config'
    mount('random-config')
  } else if (mode === 'secret') {
    currentScreen = 'secret'
    mount('secret')
  } else if (mode === 'system') {
    currentScreen = 'system'
    mount('system')
  } else if (mode === 'match') {
    currentScreen = 'match'
    mount('match')
  } else if (mode === 'match-config') {
    currentScreen = 'match-config'
    mount('match-config')
  } else if (mode === 'match-intro') {
    currentScreen = 'match-intro'
    mount('match-intro')
  } else if (mode === 'match-curated') {
    currentScreen = 'match-curated'
    mount('match-curated')
  } else if (params.get('level') !== null) {
    // Legacy URL: ?level=ch0identity1 — jump straight into campaign
    enterMode('campaign')
    currentScreen = 'campaign'
    mount('campaign')
  } else {
    currentScreen = 'menu'
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
  if (includes(gameModes, screen) && screen !== 'match') {
    enterMode(screen)
  }
  currentScreen = screen
  mount(screen)
})
