import { reset } from '../interactive/event'
import { activePath } from '../interactive/focus'
import { challenges } from '../challenges'
import { basic, fromRuleId, fromSequent } from '../render/print'
import { Workspace } from '../interactive/workspace'
import { repl } from '../interactive/repl'
import { html, plain } from '../render/segment'
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

const createListing = (
  ws: AnyWorkspace,
  onSelect: (id: string) => void,
): HTMLElement => {
  const shroud = document.createElement('div')
  shroud.setAttribute('class', 'shroud')
  shroud.setAttribute('style', 'display: none;')
  shroud.onclick = (ev) => {
    ev.preventDefault()
    shroud.setAttribute('style', 'display: none;')
  }

  const panel = document.createElement('div')
  panel.setAttribute('class', 'level-select')
  panel.onclick = (ev) => {
    ev.preventDefault()
    return false
  }

  const close = document.createElement('a')
  close.setAttribute('class', 'close')
  close.innerHTML = '\u2716'
  close.onclick = (ev) => {
    ev.preventDefault()
    shroud.setAttribute('style', 'display: none;')
  }
  panel.appendChild(close)

  const levels = document.createElement('div')
  levels.setAttribute('class', 'levels')
  ws.listConjectures().forEach(([id, challenge]) => {
    const item = document.createElement('div')
    item.setAttribute('class', 'level' + (id === ws.selected ? ' active' : ''))
    item.onclick = (ev) => {
      ev.preventDefault()
      onSelect(id)
    }
    const title = document.createElement('div')
    title.setAttribute('class', 'title')
    title.innerHTML = id
    item.appendChild(title)
    const rules = document.createElement('div')
    rules.setAttribute('class', 'rules')
    rules.innerHTML = challenge.rules
      .map((rule) => html(fromRuleId(rule)(basic)))
      .join(', ')
    item.appendChild(rules)
    const goal = document.createElement('div')
    goal.setAttribute('class', 'goal')
    goal.innerHTML = html(fromSequent(challenge.goal)(basic))
    item.appendChild(goal)
    levels.appendChild(item)
  })
  panel.appendChild(levels)
  shroud.appendChild(panel)
  return shroud
}

const createControls = (
  ws: AnyWorkspace,
  _listingEl: HTMLElement,
  rerender: () => void,
  onMenu: () => void,
  showLevelButton: boolean,
  onLevel: () => void,
): HTMLElement => {
  const canUndo = activePath(ws.currentConjecture()).length > 0
  const undoEnabled = canUndo || isGazeModeActive()
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')

  panel.appendChild(createButton('menu', false, onMenu, actionKeyHint['menu']))
  if (showLevelButton) {
    panel.appendChild(
      createButton('level', false, onLevel, actionKeyHint['level']),
    )
  }
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
  selectLevel: (id: string) => void,
  rerender: () => void,
): { hurray: HTMLElement; buttons: HTMLElement } => {
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = '\u{1F389} Conglaturations! \u{1F389}'

  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'congrabuttons')
  buttons.appendChild(
    createButton(
      'Prev Level',
      false,
      () => selectLevel(ws.previousConjectureId()),
      'p',
    ),
  )
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
  buttons.appendChild(
    createButton(
      'Next Level',
      false,
      () => selectLevel(ws.nextConjectureId()),
      '␣',
    ),
  )

  return { hurray, buttons }
}

export const mountCampaign = (
  container: HTMLElement,
  navigate: Navigate,
): (() => void) => {
  setDefaultRulesVisible(true)
  let levelPresses = 0
  const toggleLevel = (listingEl: HTMLElement) => {
    levelPresses += 1
    if (levelPresses < 2) return
    if (levelPresses === 2) {
      rerender()
      return
    }
    const isHidden = listingEl.style.display === 'none'
    if (isHidden) {
      listingEl.removeAttribute('style')
    } else {
      listingEl.setAttribute('style', 'display: none;')
    }
  }
  const ws = new Workspace(challenges)

  const selectLevel = (id: string) => {
    if (ws.isConjectureId(id)) {
      ws.selectConjecture(id)
      setGazeModeActive(false)
      history.pushState(
        { screen: 'campaign', selected: id },
        '',
        `?mode=campaign&level=${id}`,
      )
    }
    rerender()
  }

  let listingEl: HTMLElement = createListing(ws, selectLevel)

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

  const rerender = () => {
    container.innerHTML = ''
    listingEl = createListing(ws, selectLevel)
    container.appendChild(listingEl)
    const controlsEl = createControls(
      ws,
      listingEl,
      rerender,
      togglePausePopup,
      levelPresses >= 2,
      () => toggleLevel(listingEl),
    )
    const makeCongrats = () => createCongrats(ws, selectLevel, rerender)
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
        selectLevel(ws.nextConjectureId())
        return
      case 'undo':
        selectLevel(ws.previousConjectureId())
        return
    }
    rerender()
  }

  const baseDispatch = createDispatch(
    () => ws,
    rerender,
    navigate,
    onSolved,
    () => toggleLevel(listingEl),
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

  // Read initial level from URL
  const params = new URLSearchParams(window.location.search)
  const level = params.get('level') ?? ''
  if (ws.isConjectureId(level)) {
    ws.selectConjecture(level)
  }

  rerender()

  const handleKey = (ev: KeyboardEvent) => {
    console.log(ev.code)
    if (ev.code === 'KeyP' && ws.isSolved()) {
      selectLevel(ws.previousConjectureId())
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

  // Debug REPL
  const gen = repl(ws)
  gen.next('')
  Object.assign(window, {
    cmd: (input: string) => {
      const result = gen.next(input)
      console.log(plain(result.value))
      rerender()
      return result.done
    },
  })

  return () => {
    document.removeEventListener('keydown', handleKey)
    cleanupGamepad()
  }
}
