import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { createButtonCursor } from './button-cursor'
import type { CursorCell } from './button-cursor'
import { markKeyboardInput, qwertyKeyMap, setupGamepad } from './game'

export const mountMenu = (
  container: HTMLElement,
  navigate: Navigate,
): MountResult => {
  let clicks = 0
  // Reassigned on every render so the keyboard / gamepad listeners always drive
  // the buttons currently on screen.
  let cursor: ReturnType<typeof createButtonCursor> | null = null

  const render = () => {
    container.innerHTML = ''

    const panel = document.createElement('div')
    panel.setAttribute('class', 'menu')

    panel.appendChild(createLangSwitcher())

    const title = document.createElement('div')
    title.setAttribute('class', 'menu-title')
    title.innerHTML = t('title')
    title.onclick = () => {
      clicks += 1
      if (clicks > 5) navigate('secret')
    }
    panel.appendChild(title)

    const modes = document.createElement('div')
    modes.setAttribute('class', 'menu-modes')

    const cells: CursorCell[] = []

    const addMode = (label: string, activate: () => void) => {
      const btn = document.createElement('div')
      btn.setAttribute('class', 'button menu-mode')
      btn.textContent = label
      btn.onclick = activate
      modes.appendChild(btn)
      cells.push({ btn, activate })
    }
    addMode(t('versus'), () => navigate('versus-config'))
    addMode(t('random'), () => navigate('random'))
    // The tutorial holds the learning-path slot; the legacy Campaign it
    // replaced is archived in the secret menu.
    addMode(t('tutorial'), () => navigate('tutorial'))

    panel.appendChild(modes)
    container.appendChild(panel)

    // One cursor row per button: up / down move, axiom presses.
    cursor = createButtonCursor(cells.map((c) => [c]))
  }

  render()

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    markKeyboardInput()
    const action = qwertyKeyMap[ev.code]
    if (action !== undefined) cursor?.onAction(action)
  }
  document.addEventListener('keydown', handleKey)
  const cleanupGamepad = setupGamepad((action) => cursor?.onAction(action))

  return {
    cleanup: () => {
      document.removeEventListener('keydown', handleKey)
      cleanupGamepad()
    },
    rerender: render,
  }
}
