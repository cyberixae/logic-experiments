import { Navigate } from './types'
import { helpSystems, isHelpSystemId, renderSystemHelp } from '../help'

export const mountSystem = (
  container: HTMLElement,
  _navigate: Navigate,
): (() => void) => {
  const render = () => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    container.innerHTML = ''
    const panel = document.createElement('div')
    panel.setAttribute('class', 'system')

    if (id != null && isHelpSystemId(id)) {
      const back = document.createElement('a')
      back.setAttribute('class', 'button system-back')
      back.setAttribute('href', '?mode=system')
      back.innerHTML = '&larr; Systems'
      back.onclick = (e) => {
        e.preventDefault()
        history.pushState({ screen: 'system' }, '', '?mode=system')
        render()
      }
      panel.appendChild(back)

      const pre = document.createElement('pre')
      pre.setAttribute('class', 'system-doc')
      pre.textContent = renderSystemHelp(id)
      panel.appendChild(pre)
    } else {
      const title = document.createElement('div')
      title.setAttribute('class', 'system-title')
      title.innerHTML = 'Systems'
      panel.appendChild(title)

      const list = document.createElement('div')
      list.setAttribute('class', 'system-list')
      for (const sys of Object.values(helpSystems)) {
        const link = document.createElement('a')
        link.setAttribute('class', 'button system-item')
        link.setAttribute('href', `?mode=system&id=${sys.id}`)
        link.innerHTML = sys.name
        link.onclick = (e) => {
          e.preventDefault()
          history.pushState(
            { screen: 'system' },
            '',
            `?mode=system&id=${sys.id}`,
          )
          render()
        }
        list.appendChild(link)
      }
      panel.appendChild(list)
    }

    container.appendChild(panel)
  }

  render()
  return () => {}
}
