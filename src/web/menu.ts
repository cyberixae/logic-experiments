import { Navigate } from './types'

export const mountMenu = (container: HTMLElement, navigate: Navigate): (() => void) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'menu')

  const title = document.createElement('div')
  title.setAttribute('class', 'menu-title')
  title.innerHTML = 'LK'
  panel.appendChild(title)

  const modes = document.createElement('div')
  modes.setAttribute('class', 'menu-modes')

  const campaignBtn = document.createElement('div')
  campaignBtn.setAttribute('class', 'button menu-mode')
  campaignBtn.innerHTML = 'Campaign'
  campaignBtn.onclick = () => navigate('campaign')
  modes.appendChild(campaignBtn)

  const randomBtn = document.createElement('div')
  randomBtn.setAttribute('class', 'button menu-mode')
  randomBtn.innerHTML = 'Random'
  randomBtn.onclick = () => navigate('random')
  modes.appendChild(randomBtn)

  panel.appendChild(modes)

  container.innerHTML = ''
  container.appendChild(panel)

  return () => {}
}
