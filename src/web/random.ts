import { reset } from '../interactive/event'
import { activePath } from '../interactive/focus'
import { Session } from '../interactive/session'
import { Action } from '../interactive/action'
import {
  AnyWorkspace,
  ApplyReverse1,
  createBench,
  createButton,
  createDispatch,
  createPausePopup,
  dualHint,
  kbdHint,
  getActionHint,
  isGazeModeActive,
  markKeyboardInput,
  setDefaultRulesVisible,
  setGazeModeActive,
  setupGamepad,
  subscribeGamepad,
  qwertyKeyMap,
  zoomTreeIn,
  zoomTreeOut,
  zoomTreeReset,
} from './game'
import { createFormulaEditor } from './formula-editor'
import { MountResult, Navigate } from './types'
import { t } from './i18n'

const createControls = (
  getWorkspace: () => AnyWorkspace,
  rerender: () => void,
): HTMLElement => {
  const ws = getWorkspace()
  const canUndo = activePath(ws.currentConjecture()).length > 0
  const undoEnabled = canUndo || isGazeModeActive()
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')

  panel.appendChild(
    createButton(
      t('undo'),
      !undoEnabled,
      () => {
        if (canUndo) {
          ws.applyEvent({ kind: 'undo' })
        } else {
          setGazeModeActive(false)
        }
        rerender()
      },
      getActionHint('undo'),
    ),
  )
  return panel
}

const createCongrats = (
  onNew: () => void,
  onSettings: () => void,
): { hurray: HTMLElement; buttons: HTMLElement } => {
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = t('congratulations')

  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'congrabuttons')
  buttons.appendChild(
    createButton(t('customChallenge'), false, onSettings, kbdHint('b')),
  )
  buttons.appendChild(
    createButton(t('newChallenge'), false, onNew, dualHint('n', 'axiom')),
  )

  return { hurray, buttons }
}

export const mountRandom = (
  container: HTMLElement,
  navigate: Navigate,
  session: Session,
  onNewChallenge: () => void,
): MountResult => {
  setDefaultRulesVisible(false)

  const getWorkspace = () => session.workspace

  const onNew = () => {
    onNewChallenge()
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
  const openSettings = () => {
    pausePopupOpen = false
    navigate('random-config')
  }
  const resetFromPopup = () => {
    const ws = getWorkspace()
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

  let formulaEditorOpen = false
  let closeFormulaEditor: (() => void) | null = null
  const onApplyReverse1: ApplyReverse1 = (_key, onFormula) => {
    if (formulaEditorOpen) return
    formulaEditorOpen = true
    const cancel = () => {
      formulaEditorOpen = false
      closeFormulaEditor = null
      container.removeChild(modal)
    }
    const modal = createFormulaEditor(
      t('cutTitle'),
      t('cutConfirm'),
      (formula) => {
        formulaEditorOpen = false
        closeFormulaEditor = null
        container.removeChild(modal)
        onFormula(formula)
      },
      cancel,
    )
    closeFormulaEditor = cancel
    container.appendChild(modal)
  }

  const rerender = () => {
    const ws = getWorkspace()
    container.innerHTML = ''
    const controlsEl = createControls(getWorkspace, rerender)
    const makeCongrats = () => createCongrats(onNew, openSettings)
    container.appendChild(
      createBench(
        ws,
        makeCongrats,
        controlsEl,
        rerender,
        togglePausePopup,
        onApplyReverse1,
      ),
    )
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
          openSettings,
        ),
      )
    }
  }

  const onSolved = (action: Action) => {
    const ws = getWorkspace()
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
    getWorkspace,
    rerender,
    navigate,
    onSolved,
    undefined,
    togglePausePopup,
    onApplyReverse1,
  )
  const dispatch = (action: Action) => {
    if (formulaEditorOpen) {
      if (action === 'menu' || action === 'exit' || action === 'undo') {
        closeFormulaEditor?.()
      }
      return
    }
    if (action === 'exit') {
      if (pausePopupOpen) exitToMenu()
      return
    }
    if (action === 'reset' && pausePopupOpen) {
      resetFromPopup()
      return
    }
    if (action === 'undo' && pausePopupOpen) {
      closePausePopup()
      return
    }
    if (pausePopupOpen && action !== 'menu') return
    baseDispatch(action)
  }

  rerender()

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    markKeyboardInput()
    if (ev.code === 'KeyN') {
      onNew()
      return
    }
    if (ev.code === 'KeyB') {
      openSettings()
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
  const unsubscribeGamepad = subscribeGamepad(rerender)

  const cleanup = () => {
    document.removeEventListener('keydown', handleKey)
    cleanupGamepad()
    unsubscribeGamepad()
  }

  return { cleanup, rerender }
}
