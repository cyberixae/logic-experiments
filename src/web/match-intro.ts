import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'

export const mountMatchIntro = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  const render = () => {
    container.innerHTML = ''

    const panel = document.createElement('div')
    panel.setAttribute('class', 'menu')

    panel.appendChild(createLangSwitcher())

    const title = document.createElement('div')
    title.setAttribute('class', 'menu-title')
    title.textContent = t('quiz')
    panel.appendChild(title)

    const modes = document.createElement('div')
    modes.setAttribute('class', 'menu-modes')

    const startBtn = document.createElement('div')
    startBtn.setAttribute('class', 'button menu-mode')
    startBtn.textContent = t('start')
    startBtn.onclick = () => navigate('match-curated')
    modes.appendChild(startBtn)

    const customBtn = document.createElement('div')
    customBtn.setAttribute('class', 'button menu-mode')
    customBtn.textContent = t('custom')
    customBtn.onclick = () => navigate('match-config')
    modes.appendChild(customBtn)

    panel.appendChild(modes)
    container.appendChild(panel)
  }

  render()

  return { cleanup: () => {}, rerender: render }
}
