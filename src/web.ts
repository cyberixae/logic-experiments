import { Screen } from './web/types'
import { mountMenu } from './web/menu'
import { mountCampaign } from './web/campaign'
import { mountRandom } from './web/random'
import { mountSystem } from './web/system'
import { setGazeModeActive } from './web/game'

let cleanup: () => void = () => {}

const navigate = (screen: Screen) => {
  cleanup()
  if (screen === 'menu') setGazeModeActive(false)
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
      cleanup = mountMenu(body, navigate)
      break
    case 'campaign':
      cleanup = mountCampaign(body, navigate)
      break
    case 'random':
      cleanup = mountRandom(body, navigate)
      break
    case 'system':
      cleanup = mountSystem(body, navigate)
      break
  }
}

const init = () => {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')

  if (mode === 'campaign' || mode === 'random' || mode === 'system') {
    mount(mode)
  } else if (params.get('level') !== null) {
    // Legacy URL: ?level=ch0identity1 — jump straight into campaign
    mount('campaign')
  } else {
    mount('menu')
  }
}

document.addEventListener('DOMContentLoaded', init)

window.addEventListener('popstate', (event) => {
  cleanup()
  const screen: Screen = event.state?.screen ?? 'menu'
  if (screen === 'menu') setGazeModeActive(false)
  mount(screen)
})
