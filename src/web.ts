import { GameMode, gameModes } from './model/mode'
import { repl, WorkspaceFactory } from './interactive/repl'
import { Session } from './interactive/session'
import { Workspace } from './interactive/workspace'
import { challenges } from './challenges'
import { MountResult, Screen } from './web/types'
import { mountMenu } from './web/menu'
import { mountCampaign } from './web/campaign'
import { mountRandom } from './web/random'
import { mountSystem } from './web/system'
import { mountRandomConfig } from './web/random-config'
import { setGazeModeActive } from './web/game'
import { ChallengePool } from './web/challenge-pool'
import { plain } from './render/segment'
import { includes } from './utils/array'

const pool = new ChallengePool()

const session = new Session()

const factory: WorkspaceFactory = {
  campaign: () => new Workspace(challenges),
  random: () => new Workspace({ challenge: pool.take().challenge }),
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
  if (includes(gameModes, screen)) {
    enterMode(screen)
  }
  currentScreen = screen
  history.pushState(
    { screen },
    '',
    screen === 'menu' ? window.location.pathname : `?mode=${screen}`,
  )
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
    case 'system':
      current = mountSystem(body, navigate)
      break
    case 'random-config':
      current = mountRandomConfig(body, navigate, (config) => {
        pool.configure(config)
        navigate('random')
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
  history.pushState(
    { screen: expected },
    '',
    expected === 'menu' ? window.location.pathname : `?mode=${expected}`,
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
  const mode = params.get('mode')

  if (mode === 'campaign' || mode === 'random') {
    enterMode(mode)
    currentScreen = mode
    mount(mode)
  } else if (mode === 'random-config') {
    currentScreen = 'random-config'
    mount('random-config')
  } else if (mode === 'system') {
    currentScreen = 'system'
    mount('system')
  } else if (params.get('level') !== null) {
    // Legacy URL: ?level=ch0identity1 — jump straight into campaign
    enterMode('campaign')
    currentScreen = 'campaign'
    mount('campaign')
  } else {
    currentScreen = 'menu'
    mount('menu')
  }
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
  currentScreen = screen
  mount(screen)
})
