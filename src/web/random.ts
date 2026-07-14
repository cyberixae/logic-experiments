import { reset } from '../interactive/event'
import { Session } from '../interactive/session'
import { Action } from '../interactive/action'
import {
  AnyWorkspace,
  ApplyReverse1,
  createBench,
  createButton,
  createDispatch,
  createPausePopup,
  isGazeModeActive,
  markKeyboardInput,
  markPointerInput,
  setDefaultRulesVisible,
  setGazeModeActive,
  setupGamepad,
  subscribeGamepad,
  qwertyKeyMap,
  zoomTreeIn,
  zoomTreeOut,
  zoomTreeReset,
} from './game'
import { createLemmaEditorSession } from './lemma-editor'
import type { LemmaEditorSession } from './lemma-editor'
import { createButtonCursor, cursorNavActions } from './button-cursor'
import type { CursorCell } from './button-cursor'
import { MountResult, Navigate } from './types'
import { t } from './i18n'

const createControls = (
  getWorkspace: () => AnyWorkspace,
  rerender: () => void,
): HTMLElement => {
  const ws = getWorkspace()
  const canUndo = ws.canUndo()
  const undoEnabled = canUndo || isGazeModeActive()
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')

  const undoBtn = createButton(t('undo'), !undoEnabled, () => {
    if (canUndo) {
      ws.applyEvent({ kind: 'undo' })
    } else {
      setGazeModeActive(false)
    }
    rerender()
  })
  undoBtn.classList.add('mutating')
  panel.appendChild(undoBtn)
  return panel
}

const createCongrats = (
  onRetry: () => void,
  onNew: () => void,
  onSettings: () => void,
): {
  hurray: HTMLElement
  buttons: HTMLElement
  onAction: (action: Action) => void
  isEngaged: () => boolean
} => {
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = t('congratulations')

  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'congrabuttons')

  const cells: CursorCell[] = []
  const addButton = (label: string, activate: () => void): void => {
    const el = createButton(label, false, activate)
    buttons.appendChild(el)
    cells.push({ btn: el, activate })
  }
  addButton(t('challengeSetup'), onSettings)
  // Retry the same formula — a chance to find a cleaner proof before moving on.
  addButton(t('playAgain'), onRetry)
  addButton(t('newChallenge'), onNew)

  // The buttons sit side by side, so they form one row the cursor moves through
  // left / right.
  const cursor = createButtonCursor([cells])
  return {
    hurray,
    buttons,
    onAction: cursor.onAction,
    isEngaged: cursor.isEngaged,
  }
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
    lemmaSession = null
    rerender()
  }

  let pausePopupOpen = false
  let pausePopup: {
    el: HTMLElement
    onAction: (action: Action) => void
  } | null = null
  // The latest end-of-proof congrats, captured so the solved-screen dispatch can
  // drive its button cursor. Replaced on every rerender that rebuilds it.
  let congrats: {
    onAction: (action: Action) => void
    isEngaged: () => boolean
  } | null = null
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
  const onRetry = () => {
    getWorkspace().applyEvent(reset())
    setGazeModeActive(false)
    rerender()
  }
  const freshFromPopup = () => {
    pausePopupOpen = false
    onNew()
  }

  // Inline lemma editing: while a session is live, createBench swaps the
  // bottom bar for the editor and the play area shows the reverse-cut
  // pre-split ghost. The session ends on confirm (the cut applies) or cancel.
  let lemmaSession: LemmaEditorSession | null = null
  const onApplyReverse1: ApplyReverse1 = (_key, onFormula) => {
    if (lemmaSession !== null) return
    setGazeModeActive(false)
    lemmaSession = createLemmaEditorSession(
      (formula) => {
        lemmaSession = null
        onFormula(formula)
      },
      () => {
        lemmaSession = null
        rerender()
      },
    )
    rerender()
  }

  const rerender = () => {
    const ws = getWorkspace()
    container.innerHTML = ''
    const controlsEl = createControls(getWorkspace, rerender)
    const makeCongrats = () => {
      const c = createCongrats(onRetry, onNew, openSettings)
      congrats = c
      return c
    }
    container.appendChild(
      createBench(
        ws,
        makeCongrats,
        controlsEl,
        rerender,
        togglePausePopup,
        onApplyReverse1,
        undefined,
        undefined,
        freshFromPopup,
        undefined,
        undefined,
        lemmaSession,
      ),
    )
    if (pausePopupOpen) {
      // Build once per open so the cursor position survives the rerenders that
      // gamepad polling triggers while paused; rebuild on the next open.
      if (!pausePopup) {
        pausePopup = createPausePopup(closePausePopup, exitToMenu, openSettings)
      }
      container.appendChild(pausePopup.el)
    } else {
      pausePopup = null
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
    if (lemmaSession !== null) {
      const session = lemmaSession
      if (action === 'undo') {
        // Undo-past-the-beginning backs out of the editor entirely.
        if (session.undo()) rerender()
        else session.cancel()
      } else if (action === 'menu' || action === 'exit') {
        session.cancel()
      }
      return
    }
    if (action === 'exit') {
      if (pausePopupOpen) exitToMenu()
      return
    }
    if (action === 'undo' && pausePopupOpen) {
      closePausePopup()
      return
    }
    if (pausePopupOpen && action !== 'menu') {
      pausePopup?.onAction(action)
      return
    }
    // On the end-of-proof screen, arrow keys drive the congrats button cursor
    // (and axiom presses the focused button once engaged) instead of falling
    // through to onSolved, which replays the completion animation.
    if (getWorkspace().isSolved() && congrats) {
      if (cursorNavActions.has(action)) {
        congrats.onAction(action)
        return
      }
      if (action === 'axiom' && congrats.isEngaged()) {
        congrats.onAction('axiom')
        return
      }
    }
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
  document.documentElement.classList.add('mode-single')
  document.addEventListener('keydown', handleKey)
  document.addEventListener('pointerdown', markPointerInput)
  const cleanupGamepad = setupGamepad(dispatch)
  const unsubscribeGamepad = subscribeGamepad(rerender)

  const cleanup = () => {
    document.documentElement.classList.remove('mode-single')
    document.removeEventListener('keydown', handleKey)
    document.removeEventListener('pointerdown', markPointerInput)
    cleanupGamepad()
    unsubscribeGamepad()
  }

  return { cleanup, rerender }
}
