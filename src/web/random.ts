import { reset } from '../interactive/event'
import { activePath } from '../interactive/focus'
import { Workspace } from '../interactive/workspace'
import { ChallengePool } from './challenge-pool'
import { Action } from '../interactive/action'
import {
  AnyWorkspace,
  actionKeyHint,
  createBench,
  createButton,
  createDispatch,
  setupGamepad,
  qwertyKeyMap,
} from './game'
import { Navigate } from './types'

const newWorkspace = (pool: ChallengePool): AnyWorkspace =>
  new Workspace({ challenge: pool.take() }) as unknown as AnyWorkspace

const createControls = (
  ws: AnyWorkspace,
  onNew: () => void,
  rerender: () => void,
  navigate: Navigate,
): HTMLElement => {
  const canUndo = activePath(ws.currentConjecture()).length > 0
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')

  panel.appendChild(
    createButton(
      'undo',
      !canUndo,
      () => {
        ws.applyEvent({ kind: 'undo' })
        rerender()
      },
      actionKeyHint['undo'],
    ),
  )
  panel.appendChild(
    createButton(
      'reset',
      !canUndo,
      () => {
        ws.applyEvent(reset())
        rerender()
      },
      actionKeyHint['reset'],
    ),
  )
  panel.appendChild(createButton('new', false, onNew))
  panel.appendChild(
    createButton('menu', false, () => navigate('menu'), actionKeyHint['menu']),
  )
  return panel
}

const createCongrats = (
  ws: AnyWorkspace,
  onNew: () => void,
  rerender: () => void,
): HTMLElement => {
  const panel = document.createElement('div')

  const banner = document.createElement('div')
  banner.setAttribute('class', 'congrats')
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = '\n\n\u{1F389} Conglaturations! \u{1F389}\n'
  banner.appendChild(hurray)
  panel.appendChild(banner)

  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'congrabuttons')
  buttons.appendChild(
    createButton('Play Again', false, () => {
      ws.applyEvent(reset())
      rerender()
    }),
  )
  buttons.appendChild(createButton('New Challenge', false, onNew))
  panel.appendChild(buttons)

  return panel
}

export const mountRandom = (
  container: HTMLElement,
  navigate: Navigate,
): (() => void) => {
  const pool = new ChallengePool()
  let ws = newWorkspace(pool)

  const onNew = () => {
    ws = newWorkspace(pool)
    rerender()
  }

  const rerender = () => {
    container.innerHTML = ''
    const controlsEl = createControls(ws, onNew, rerender, navigate)
    const makeCongrats = () => createCongrats(ws, onNew, rerender)
    container.appendChild(createBench(ws, makeCongrats, controlsEl, rerender))
  }

  const onSolved = (action: Action) => {
    switch (action) {
      case 'leftWeakening':
      case 'rightWeakening':
        ws.applyEvent(reset())
        break
      case 'axiom':
      case 'rightConnective':
        onNew()
        return
    }
    rerender()
  }

  const dispatch = createDispatch(() => ws, rerender, navigate, onSolved)

  rerender()

  const handleKey = (ev: KeyboardEvent) => {
    const action = qwertyKeyMap[ev.code]
    if (action) dispatch(action)
  }
  document.addEventListener('keydown', handleKey)
  const cleanupGamepad = setupGamepad(dispatch)

  return () => {
    document.removeEventListener('keydown', handleKey)
    cleanupGamepad()
    pool.cleanup()
  }
}
