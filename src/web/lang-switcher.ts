import {
  availableLocales,
  changeLanguage,
  clearLangOverride,
  endonymOf,
  getLocale,
  getSystemLocale,
} from './i18n'

export const createLangSwitcher = (): HTMLElement => {
  const wrap = document.createElement('div')
  wrap.className = 'lang-switcher'

  const current = getLocale()

  const button = document.createElement('div')
  button.className = 'lang-switcher-button'
  const globe = document.createElement('span')
  globe.textContent = '\u{1F310}'
  const name = document.createElement('span')
  name.className = 'lang-switcher-name'
  name.textContent = endonymOf(current)
  const chevron = document.createElement('span')
  chevron.textContent = '\u25BE'
  button.appendChild(globe)
  button.appendChild(name)
  button.appendChild(chevron)

  const menu = document.createElement('div')
  menu.className = 'lang-switcher-menu'
  menu.hidden = true

  const systemCode = getSystemLocale()
  const urlHasLang = new URLSearchParams(window.location.search).has('lang')

  const systemItem = document.createElement('div')
  systemItem.className = 'lang-switcher-item'
  if (!urlHasLang) systemItem.classList.add('active')
  systemItem.textContent = endonymOf(systemCode)
  systemItem.onclick = (ev) => {
    ev.stopPropagation()
    clearLangOverride()
  }
  menu.appendChild(systemItem)

  const separator = document.createElement('hr')
  menu.appendChild(separator)

  const sortedLocales = [...availableLocales].sort((a, b) =>
    endonymOf(a).localeCompare(endonymOf(b)),
  )

  for (const code of sortedLocales) {
    const item = document.createElement('div')
    item.className = 'lang-switcher-item'
    if (urlHasLang && code === current) item.classList.add('active')
    item.textContent = endonymOf(code)
    item.onclick = (ev) => {
      ev.stopPropagation()
      changeLanguage(code)
    }
    menu.appendChild(item)
  }

  button.onclick = (ev) => {
    ev.stopPropagation()
    if (menu.hidden) {
      menu.hidden = false
      setTimeout(() => {
        document.addEventListener(
          'click',
          () => {
            menu.hidden = true
          },
          { once: true },
        )
      }, 0)
    } else {
      menu.hidden = true
    }
  }

  wrap.appendChild(button)
  wrap.appendChild(menu)
  return wrap
}
