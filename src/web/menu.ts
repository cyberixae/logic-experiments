import { gameModes } from '../model/mode'
import { MountResult, Navigate } from './types'

export const mountMenu = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'menu')

  const title = document.createElement('div')
  title.setAttribute('class', 'menu-title')
  title.innerHTML = 'LK'
  panel.appendChild(title)

  const modes = document.createElement('div')
  modes.setAttribute('class', 'menu-modes')

  for (const mode of gameModes) {
    const btn = document.createElement('div')
    btn.setAttribute('class', 'button menu-mode')
    btn.innerHTML = mode.charAt(0).toUpperCase() + mode.slice(1)
    btn.onclick = () => navigate(mode)
    modes.appendChild(btn)
  }

  panel.appendChild(modes)

  container.innerHTML = ''
  container.appendChild(panel)

  return { cleanup: () => {}, rerender: () => {} }
}
