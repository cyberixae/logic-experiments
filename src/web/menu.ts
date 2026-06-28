import { gameModes, GameMode } from '../model/mode'
import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { createButtonCursor } from './button-cursor'
import type { CursorCell } from './button-cursor'
import { markKeyboardInput, qwertyKeyMap, setupGamepad } from './game'

const modeLabel: Record<GameMode, () => string> = {
  random: () => t('random'),
  campaign: () => t('campaign'),
}

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

    const versusBtn = document.createElement('div')
    versusBtn.setAttribute('class', 'button menu-mode')
    versusBtn.textContent = t('versus')
    const versusActivate = () => navigate('versus-config')
    versusBtn.onclick = versusActivate
    modes.appendChild(versusBtn)
    cells.push({ btn: versusBtn, activate: versusActivate })

    for (const mode of gameModes) {
      const btn = document.createElement('div')
      btn.setAttribute('class', 'button menu-mode')
      btn.innerHTML = modeLabel[mode]()
      const activate = () => navigate(mode)
      btn.onclick = activate
      modes.appendChild(btn)
      cells.push({ btn, activate })
    }

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
