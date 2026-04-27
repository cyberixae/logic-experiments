import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'

export const mountSecret = (
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
    title.innerHTML = t('secret')
    panel.appendChild(title)

    const modes = document.createElement('div')
    modes.setAttribute('class', 'menu-modes')

    const matchBtn = document.createElement('div')
    matchBtn.setAttribute('class', 'button menu-mode')
    matchBtn.innerHTML = t('quiz')
    matchBtn.onclick = () => navigate('match-curated')
    modes.appendChild(matchBtn)

    const systemsBtn = document.createElement('div')
    systemsBtn.setAttribute('class', 'button menu-mode')
    systemsBtn.innerHTML = t('systems')
    systemsBtn.onclick = () => navigate('system')
    modes.appendChild(systemsBtn)

    panel.appendChild(modes)

    const backBtn = document.createElement('div')
    backBtn.setAttribute('class', 'button menu-mode')
    backBtn.innerHTML = t('back')
    backBtn.onclick = () => navigate('menu')
    panel.appendChild(backBtn)

    container.appendChild(panel)
  }

  render()

  return { cleanup: () => {}, rerender: render }
}
