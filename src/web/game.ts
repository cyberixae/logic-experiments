import {
  reverse0,
  undo,
  reset,
  prevBranch,
  nextBranch,
} from '../interactive/event'
import { activePath, activeSequent } from '../interactive/focus'
import { Rule } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { fromDerivation } from '../render/print'
import { RuleId } from '../model/rule'
import { renderDerivation, layoutTree } from './tree'
import { Configuration } from '../model/challenge'
import {
  center,
  isReverseId0,
  left,
  leftLogical,
  right,
  rightLogical,
} from '../rules'
import { Workspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import { computeGhostChain } from '../interactive/ghost'
import { Navigate } from './types'
import { entries, keys } from '../utils/record'

export type AnyWorkspace = Workspace<
  string,
  Record<string, Configuration<AnySequent>>
>

export const qwertyKeyMap: Record<KeyboardEvent['code'], Action> = {
  Escape: 'menu',
  Backquote: 'level',
  KeyW: 'prevBranch',
  KeyO: 'nextBranch',
  KeyR: 'reset',
  KeyA: 'leftRotateLeft',
  KeyS: 'leftWeakening',
  KeyF: 'leftConnective',
  KeyG: 'leftRotateRight',
  KeyH: 'rightRotateLeft',
  KeyJ: 'rightConnective',
  KeyL: 'rightWeakening',
  Semicolon: 'rightRotateRight',
  Space: 'axiom',
  Enter: 'axiom',
  Backspace: 'undo',
  ArrowLeft: 'gazeLeft',
  ArrowRight: 'gazeRight',
  ArrowUp: 'gazeConnective',
  ArrowDown: 'gazeWeakening',
}

const codeToLabel = (code: string): string => {
  const special: Record<string, string> = {
    Backquote: '§',
    Semicolon: 'ö',
    Space: '⎵',
    Enter: '↵',
    Backspace: '⌫',
    Escape: '\u238b',
  }
  const char = special[code] ?? String()
  if (char) return char
  if (code.startsWith('Key')) return code.slice(3).toLowerCase()
  return code.toLowerCase()
}

// First binding for each action wins (e.g. Space before Enter for axiom)
export const actionKeyHint: Partial<Record<Action, string>> = {}
for (const [code, action] of Object.entries(qwertyKeyMap)) {
  if (!(action in actionKeyHint)) {
    actionKeyHint[action] = codeToLabel(code)
  }
}

const ruleAction: Partial<Record<RuleId, Action>> = {
  swl: 'leftWeakening',
  sRotLF: 'leftRotateLeft',
  sRotLB: 'leftRotateRight',
  nl: 'leftConnective',
  cl: 'leftConnective',
  cl1: 'leftConnective',
  cl2: 'leftConnective',
  dl: 'leftConnective',
  fdl: 'leftConnective',
  il: 'leftConnective',
  fil: 'leftConnective',
  swr: 'rightWeakening',
  sRotRB: 'rightRotateLeft',
  sRotRF: 'rightRotateRight',
  nr: 'rightConnective',
  dr: 'rightConnective',
  dr1: 'rightConnective',
  dr2: 'rightConnective',
  cr: 'rightConnective',
  fcr: 'rightConnective',
  ir: 'rightConnective',
  i: 'axiom',
  f: 'axiom',
  v: 'axiom',
  a1: 'axiom',
  a2: 'axiom',
  a3: 'axiom',
}

const keyHintBadge = (hint: string): HTMLElement => {
  const badge = document.createElement('span')
  badge.setAttribute('class', 'key-hint')
  badge.textContent = hint
  return badge
}

export const ps5KeyMap: Record<number, Action> = {
  12: 'leftWeakening',
  14: 'leftRotateLeft',
  15: 'leftRotateRight',
  13: 'leftConnective',
  3: 'rightWeakening',
  2: 'rightRotateLeft',
  1: 'rightRotateRight',
  0: 'rightConnective',
  5: 'axiom',
  4: 'undo',
}

export const createButton = (
  label: string,
  disabled: boolean,
  onClick?: () => void,
  hint?: string,
): HTMLElement => {
  const el = document.createElement('pre')
  el.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
  if (!disabled && onClick) el.onclick = onClick
  if (hint !== undefined) {
    el.appendChild(keyHintBadge(hint))
    el.appendChild(document.createTextNode(' ' + label))
  } else {
    el.innerHTML = label
  }
  return el
}

let treeZoom = 1
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const ZOOM_STEP = 0.2
const AUTO_ZOOM_MAX = 1.4
const AUTO_ZOOM_PAD = 0.9

const CHECK_STEP_MS = 120
const CHECK_HOLD_MS = 260

const runProofCheckSweep = (tree: HTMLElement): void => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }
  const nodes = Array.from(tree.querySelectorAll('.tree-node')) as HTMLElement[]
  if (nodes.length === 0) return
  const byDepth = new Map<number, HTMLElement[]>()
  let maxDepth = 0
  for (const n of nodes) {
    const d = Number(n.dataset['leafDepth'] ?? '0')
    if (d > maxDepth) maxDepth = d
    const list = byDepth.get(d)
    if (list) list.push(n)
    else byDepth.set(d, [n])
  }
  for (let d = 0; d <= maxDepth; d += 1) {
    const level = byDepth.get(d)
    if (!level) continue
    setTimeout(() => {
      for (const n of level) n.classList.add('tree-checking')
      setTimeout(() => {
        for (const n of level) n.classList.remove('tree-checking')
      }, CHECK_HOLD_MS)
    }, d * CHECK_STEP_MS)
  }
}

let lastScrollTop = 0

const createPlayArea = (workspace: AnyWorkspace): HTMLElement => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'playarea')
  panel.style.setProperty('--tree-zoom', String(treeZoom))
  panel.addEventListener('scroll', () => {
    lastScrollTop = panel.scrollTop
  })
  const startTop = lastScrollTop
  const focus = workspace.currentConjecture()
  const gaze = workspace.gaze()
  const ghost = computeGhostChain(activeSequent(focus), gaze, workspace.gazeKind())
  const tree = renderDerivation(
    focus.derivation,
    activePath(focus),
    workspace.applicableRules(),
    gaze,
    ghost,
  )
  const solved = workspace.isSolved()
  const isFresh = focus.derivation.kind === 'premise'
  tree.style.visibility = 'hidden'
  panel.appendChild(tree)
  requestAnimationFrame(() => {
    panel.scrollTo({ top: startTop, behavior: 'instant' })
    layoutTree(tree, { skipActiveScroll: solved })
    if (isFresh && !solved) {
      const rootSequent = tree.querySelector(
        ':scope > .tree-sequent',
      ) as HTMLElement | null
      if (rootSequent) {
        const sequentRect = rootSequent.getBoundingClientRect()
        const areaRect = panel.getBoundingClientRect()
        const fontPx = parseFloat(getComputedStyle(panel).fontSize)
        const availW = areaRect.width - 2 * 8 * fontPx
        if (sequentRect.width > 0 && availW > 0) {
          const target = Math.max(
            ZOOM_MIN,
            Math.min(
              AUTO_ZOOM_MAX,
              (treeZoom * availW * AUTO_ZOOM_PAD) / sequentRect.width,
            ),
          )
          if (Math.abs(target - treeZoom) > 0.01) {
            treeZoom = target
            panel.style.setProperty('--tree-zoom', String(treeZoom))
            layoutTree(tree, { skipActiveScroll: solved })
          }
        }
      }
    }
    tree.style.visibility = ''
    if (solved) {
      const treeRect = tree.getBoundingClientRect()
      const areaRect = panel.getBoundingClientRect()
      const fontPx = parseFloat(getComputedStyle(panel).fontSize)
      const availW = areaRect.width - 2 * 8 * fontPx
      const availH = areaRect.height - (8 + 6) * fontPx
      const scale = Math.min(
        1,
        availW / treeRect.width,
        availH / treeRect.height,
      )
      tree.style.transformOrigin = 'center bottom'
      tree.style.transition = 'transform 1.2s ease-in-out'
      const onZoomEnd = (e: TransitionEvent): void => {
        if (e.propertyName !== 'transform') return
        tree.removeEventListener('transitionend', onZoomEnd)
        runProofCheckSweep(tree)
      }
      tree.addEventListener('transitionend', onZoomEnd)
      requestAnimationFrame(() => {
        tree.style.transform = `scale(${scale})`
        tree.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'center',
        })
      })
    }
  })
  return panel
}

const createPanel = <K extends RuleId>(
  className: string,
  ruleRecord: Record<K, Rule<AnySequent>>,
  ls: ReadonlyArray<RuleId>,
  rules: ReadonlyArray<RuleId>,
  solved: boolean,
  onApply: (key: RuleId) => void,
): HTMLElement => {
  const panel = document.createElement('div')
  panel.setAttribute('class', className)
  entries(ruleRecord).forEach(([key, rule]) => {
    if (!rules.includes(key)) return
    const disabled = solved || !ls.includes(key)
    const pre = document.createElement('pre')
    pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
    if (!disabled) pre.onclick = () => onApply(key)
    pre.innerHTML = fromDerivation(rule.example)
    const action = ruleAction[key]
    const hint = action !== undefined ? actionKeyHint[action] : undefined
    if (hint !== undefined) pre.appendChild(keyHintBadge(hint))
    panel.appendChild(pre)
  })
  return panel
}

export const createBench = (
  workspace: AnyWorkspace,
  makeCongrats: () => HTMLElement,
  controlsEl: HTMLElement,
  rerender: () => void,
): HTMLElement => {
  const ls = workspace.applicableRules()
  const rules = workspace.availableRules()
  const solved = workspace.isSolved()

  const apply = (key: RuleId) => {
    if (isReverseId0(key)) workspace.applyEvent(reverse0(key))
    rerender()
  }
  const applyCenter = (key: RuleId) => {
    if (isReverseId0(key)) workspace.applyEvent(reverse0(key))
    rerender()
  }

  const panel = document.createElement('div')
  panel.setAttribute('class', 'bench')
  panel.appendChild(createPanel('left', left, ls, rules, solved, apply))
  if (solved) {
    panel.appendChild(makeCongrats())
  } else {
    panel.appendChild(
      createPanel('main', center, ls, rules, solved, applyCenter),
    )
  }
  panel.appendChild(createPanel('right', right, ls, rules, solved, apply))
  panel.appendChild(createPlayArea(workspace))
  const zoomOut = createButton('−', false, () => {
    treeZoom = Math.max(ZOOM_MIN, treeZoom - ZOOM_STEP)
    rerender()
  })
  const zoomReset = createButton('⊙', false, () => {
    treeZoom = 1
    rerender()
  })
  const zoomIn = createButton('+', false, () => {
    treeZoom = Math.min(ZOOM_MAX, treeZoom + ZOOM_STEP)
    rerender()
  })
  controlsEl.appendChild(zoomOut)
  controlsEl.appendChild(zoomReset)
  controlsEl.appendChild(zoomIn)
  panel.appendChild(controlsEl)
  return panel
}

const autoRule = (workspace: AnyWorkspace, rules: RuleId[]) => {
  const available = workspace.applicableRules()
  const [first] = rules.filter((rule) => available.includes(rule))
  if (!first) return
  if (isReverseId0(first)) workspace.applyEvent(reverse0(first))
}

export const createDispatch =
  (
    getWorkspace: () => AnyWorkspace,
    rerender: () => void,
    navigate: Navigate,
    onSolved: (action: Action) => void,
    onLevel?: () => void,
  ) =>
  (action: Action): void => {
    if (action === 'menu') {
      navigate('menu')
      return
    }
    if (action === 'level') {
      onLevel?.()
      return
    }
    const workspace = getWorkspace()
    if (action === 'reset') {
      workspace.applyEvent(reset())
      rerender()
      return
    }
    if (workspace.isSolved()) {
      onSolved(action)
      return
    }
    switch (action) {
      case 'leftWeakening':
        workspace.applyEvent(reverse0('swl'))
        break
      case 'leftRotateLeft':
        workspace.applyEvent(reverse0('sRotLF'))
        break
      case 'leftRotateRight':
        workspace.applyEvent(reverse0('sRotLB'))
        break
      case 'leftConnective':
        autoRule(workspace, keys(leftLogical))
        break
      case 'rightWeakening':
        workspace.applyEvent(reverse0('swr'))
        break
      case 'rightRotateLeft':
        workspace.applyEvent(reverse0('sRotRB'))
        break
      case 'rightRotateRight':
        workspace.applyEvent(reverse0('sRotRF'))
        break
      case 'rightConnective':
        autoRule(workspace, keys(rightLogical))
        break
      case 'prevBranch':
        workspace.applyEvent(prevBranch())
        break
      case 'nextBranch':
        workspace.applyEvent(nextBranch())
        break
      case 'axiom':
        autoRule(workspace, keys(center))
        break
      case 'undo':
        workspace.applyEvent(undo())
        break
      case 'gazeLeft':
        workspace.moveGaze(-1)
        break
      case 'gazeRight':
        workspace.moveGaze(1)
        break
      case 'gazeConnective':
        workspace.setGazeKind('connective')
        applyGazeRule(workspace, 'connective')
        break
      case 'gazeWeakening':
        workspace.setGazeKind('weakening')
        applyGazeRule(workspace, 'weakening')
        break
    }
    rerender()
  }

const applyGazeRule = (
  workspace: AnyWorkspace,
  kind: 'connective' | 'weakening',
): void => {
  const gaze = workspace.gaze()
  const seq = activeSequent(workspace.currentConjecture())
  const ant = seq.antecedent.length
  const suc = seq.succedent.length
  if (gaze.side === 'left') {
    if (ant === 0) return
    const activeIndex = ant - 1
    if (gaze.index === activeIndex) {
      // At active position — apply the rule directly
      if (kind === 'connective') {
        autoRule(workspace, keys(leftLogical))
      } else {
        workspace.applyEvent(reverse0('swl'))
      }
      return
    }
    // Not at active — rotate one step toward arrow
    workspace.applyEventWithGaze(reverse0('sRotLB'), {
      side: 'left',
      index: gaze.index + 1,
    })
  } else {
    if (suc === 0) return
    const activeIndex = 0
    if (gaze.index === activeIndex) {
      if (kind === 'connective') {
        autoRule(workspace, keys(rightLogical))
      } else {
        workspace.applyEvent(reverse0('swr'))
      }
      return
    }
    workspace.applyEventWithGaze(reverse0('sRotRB'), {
      side: 'right',
      index: gaze.index - 1,
    })
  }
}

export const setupGamepad = (
  dispatch: (action: Action) => void,
): (() => void) => {
  const oldPresses: Array<boolean> = []
  let active = false

  const loop = () => {
    if (!active) return
    const gp = navigator.getGamepads()[0]
    if (gp) {
      for (const [button, action] of Object.entries(ps5KeyMap)) {
        const index = Number(button)
        const oldPress = oldPresses[index] ?? false
        const newPress = gp.buttons[index]?.pressed ?? false
        if (newPress !== oldPress) {
          if (newPress) dispatch(action)
          oldPresses[index] = newPress
        }
      }
    }
    requestAnimationFrame(loop)
  }

  const onConnected = () => {
    active = true
    loop()
  }

  window.addEventListener('gamepadconnected', onConnected)

  return () => {
    active = false
    window.removeEventListener('gamepadconnected', onConnected)
  }
}
