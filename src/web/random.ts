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
  createPausePopup,
  isGazeModeActive,
  setDefaultRulesVisible,
  setGazeModeActive,
  setupGamepad,
  qwertyKeyMap,
  zoomTreeIn,
  zoomTreeOut,
  zoomTreeReset,
} from './game'
import { Navigate } from './types'

const newWorkspace = (pool: ChallengePool): AnyWorkspace =>
  new Workspace({ challenge: pool.take() })

const createControls = (
  ws: AnyWorkspace,
  rerender: () => void,
  onMenu: () => void,
): HTMLElement => {
  const canUndo = activePath(ws.currentConjecture()).length > 0
  const undoEnabled = canUndo || isGazeModeActive()
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')

  panel.appendChild(createButton('menu', false, onMenu, actionKeyHint['menu']))
  panel.appendChild(
    createButton(
      'undo',
      !undoEnabled,
      () => {
        if (canUndo) {
          ws.applyEvent({ kind: 'undo' })
        } else {
          setGazeModeActive(false)
        }
        rerender()
      },
      actionKeyHint['undo'],
    ),
  )
  return panel
}

const createCongrats = (
  ws: AnyWorkspace,
  onNew: () => void,
  rerender: () => void,
): { hurray: HTMLElement; buttons: HTMLElement } => {
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = '\u{1F389} Conglaturations! \u{1F389}'

  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'congrabuttons')
  buttons.appendChild(
    createButton(
      'Play Again',
      false,
      () => {
        ws.applyEvent(reset())
        rerender()
      },
      actionKeyHint['reset'],
    ),
  )
  buttons.appendChild(createButton('New Challenge', false, onNew, 'n'))

  return { hurray, buttons }
}

export const mountRandom = (
  container: HTMLElement,
  navigate: Navigate,
): (() => void) => {
  setDefaultRulesVisible(false)
  const pool = new ChallengePool()
  let ws = newWorkspace(pool)

  const onNew = () => {
    ws = newWorkspace(pool)
    setGazeModeActive(false)
    rerender()
  }

  let pausePopupOpen = false
  const togglePausePopup = () => {
    pausePopupOpen = !pausePopupOpen
    rerender()
  }
  const closePausePopup = () => {
    pausePopupOpen = false
    rerender()
  }
  const exitToMenu = () => {
    pausePopupOpen = false
    navigate('menu')
  }
  const resetFromPopup = () => {
    if (activePath(ws.currentConjecture()).length > 0) {
      ws.applyEvent(reset())
    }
    setGazeModeActive(false)
    pausePopupOpen = false
    rerender()
  }
  const freshFromPopup = () => {
    pausePopupOpen = false
    onNew()
  }

  const rerender = () => {
    container.innerHTML = ''
    const controlsEl = createControls(ws, rerender, togglePausePopup)
    const makeCongrats = () => createCongrats(ws, onNew, rerender)
    container.appendChild(createBench(ws, makeCongrats, controlsEl, rerender))
    if (pausePopupOpen) {
      const canReset = activePath(ws.currentConjecture()).length > 0
      const resetEnabled = canReset || isGazeModeActive()
      container.appendChild(
        createPausePopup(
          closePausePopup,
          exitToMenu,
          resetFromPopup,
          !resetEnabled,
          freshFromPopup,
        ),
      )
    }
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

  const baseDispatch = createDispatch(
    () => ws,
    rerender,
    navigate,
    onSolved,
    undefined,
    togglePausePopup,
  )
  const dispatch = (action: Action) => {
    if (action === 'exit') {
      if (pausePopupOpen) exitToMenu()
      return
    }
    if (action === 'reset' && pausePopupOpen) {
      resetFromPopup()
      return
    }
    if (pausePopupOpen && action !== 'menu') return
    baseDispatch(action)
  }

  rerender()

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.code === 'KeyN') {
      onNew()
      return
    }
    if (ev.code === 'Slash' || ev.code === 'Equal') {
      zoomTreeOut()
      rerender()
      return
    }
    if (ev.code === 'Minus') {
      zoomTreeIn()
      rerender()
      return
    }
    if (ev.code === 'Digit0') {
      zoomTreeReset()
      rerender()
      return
    }
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
