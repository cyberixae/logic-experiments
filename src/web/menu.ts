import { gameModes, GameMode } from '../model/mode'
import { MountResult, Navigate } from './types'
import { t } from './i18n'

const modeLabel: Record<GameMode, () => string> = {
  random: () => t('random'),
  campaign: () => t('campaign'),
}

export const mountMenu = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'menu')

  const title = document.createElement('div')
  title.setAttribute('class', 'menu-title')
  title.innerHTML = t('title')
  panel.appendChild(title)

  const modes = document.createElement('div')
  modes.setAttribute('class', 'menu-modes')

  for (const mode of gameModes) {
    const btn = document.createElement('div')
    btn.setAttribute('class', 'button menu-mode')
    btn.innerHTML = modeLabel[mode]()
    btn.onclick = () => navigate(mode === 'random' ? 'random-config' : mode)
    modes.appendChild(btn)
  }

  panel.appendChild(modes)

  container.innerHTML = ''
  container.appendChild(panel)

  return { cleanup: () => {}, rerender: () => {} }
}
