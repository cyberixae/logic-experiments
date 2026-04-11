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
import { branches, subDerivation } from '../model/derivation'
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
import { isNonNullable } from '../utils/utils'

export type AnyWorkspace = Workspace<
  string,
  Record<string, Configuration<AnySequent>>
>

export const qwertyKeyMap: Record<KeyboardEvent['code'], Action> = {
  KeyM: 'menu',
  Escape: 'menu',
  KeyX: 'exit',
  Backquote: 'level',
  KeyW: 'prevBranch',
  KeyO: 'nextBranch',
  KeyY: 'reset',
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
  KeyR: 'toggleRules',
}

const codeToLabel = (code: string): string => {
  const special: Record<string, string> = {
    Backquote: '§',
    Semicolon: 'ö',
    Space: '⎵',
    Enter: '↵',
    Backspace: '⌫',
    Escape: '\u238b',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
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

const keyHintBadge = (
  hint: string,
  variant: 'base' | 'hot' | 'cold' | 'coldGhost' = 'base',
): HTMLElement => {
  const badge = document.createElement('span')
  const cls =
    variant === 'hot'
      ? 'key-hint hot'
      : variant === 'cold'
        ? 'key-hint cold'
        : variant === 'coldGhost'
          ? 'key-hint cold ghost'
          : 'key-hint'
  badge.setAttribute('class', cls)
  badge.textContent = hint
  return badge
}

export const ps5KeyMap: Record<number, Action> = {
  0: 'axiom', // Cross — confirm
  1: 'undo', // Circle — cancel
  2: 'gazeWeakening', // Square
  3: 'gazeConnective', // Triangle
  4: 'prevBranch', // L1
  5: 'nextBranch', // R1
  14: 'gazeLeft', // D-pad left
  15: 'gazeRight', // D-pad right
}

export const createButton = (
  label: string,
  disabled: boolean,
  onClick?: () => void,
  hint?: string,
  hintVariant: 'base' | 'hot' | 'cold' = 'base',
): HTMLElement => {
  const el = document.createElement('pre')
  el.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
  if (!disabled && onClick) el.onclick = onClick
  if (hint !== undefined) {
    el.appendChild(keyHintBadge(hint, hintVariant))
    el.appendChild(document.createTextNode(' ' + label))
  } else {
    el.innerHTML = label
  }
  return el
}

let rulesVisible = true

export const setDefaultRulesVisible = (visible: boolean): void => {
  rulesVisible = visible
}

let gazeModeActive = false

export const isGazeModeActive = (): boolean => gazeModeActive
export const setGazeModeActive = (active: boolean): void => {
  gazeModeActive = active
}

let treeZoom = 1
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const ZOOM_STEP = 0.2

let autoZoomedDerivation: unknown = null
export const zoomTreeOut = (): void => {
  treeZoom = Math.max(ZOOM_MIN, treeZoom - ZOOM_STEP)
}
export const zoomTreeReset = (): void => {
  treeZoom = 1
}
export const zoomTreeIn = (): void => {
  treeZoom = Math.min(ZOOM_MAX, treeZoom + ZOOM_STEP)
}
const AUTO_ZOOM_MAX = 1.2
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
  const nodes = Array.from(tree.querySelectorAll<HTMLElement>('.tree-node'))
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
let lastScrollLeft = 0

const createPlayArea = (workspace: AnyWorkspace): HTMLElement => {
  const panel = document.createElement('div')
  const solvedClass = workspace.isSolved() ? ' solved' : ''
  panel.setAttribute('class', 'playarea' + solvedClass)
  panel.style.setProperty('--tree-zoom', String(treeZoom))
  panel.addEventListener('scroll', () => {
    lastScrollTop = panel.scrollTop
    lastScrollLeft = panel.scrollLeft
  })
  const startTop = lastScrollTop
  const startLeft = lastScrollLeft
  const focus = workspace.currentConjecture()
  const solved = workspace.isSolved()
  const gaze = gazeModeActive ? workspace.gaze() : null
  const ghost = gazeModeActive
    ? computeGhostChain(
        activeSequent(focus),
        workspace.gaze(),
        workspace.gazeKind(),
        workspace.availableRules(),
      )
    : null
  const tree = renderDerivation(
    focus.derivation,
    solved ? [-1] : activePath(focus),
    gaze,
    ghost,
  )
  const isFresh = focus.derivation.kind === 'premise'
  tree.style.visibility = 'hidden'
  panel.appendChild(tree)
  requestAnimationFrame(() => {
    layoutTree(tree, { skipActiveScroll: true })
    panel.scrollTo({ top: startTop, left: startLeft, behavior: 'instant' })
    if (!solved) {
      requestAnimationFrame(() => {
        const active = tree.querySelector<HTMLElement>(
          '.tree-active, .tree-closed-active',
        )
        if (active) {
          active.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }
      })
    }
    if (isFresh && !solved && autoZoomedDerivation !== focus.derivation) {
      autoZoomedDerivation = focus.derivation
      const rootSequent = tree.querySelector<HTMLElement>(
        ':scope > .tree-sequent',
      )
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
            layoutTree(tree, { skipActiveScroll: true })
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
      const availH = (areaRect.height - (8 + 1) * fontPx) * 0.85
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

const ruleConnectiveLabel: Partial<Record<RuleId, string>> = {
  nl: '¬',
  nr: '¬',
  cl: '∧',
  cl1: '∧',
  cl2: '∧',
  cr: '∧',
  fcr: '∧',
  dl: '∨',
  dr: '∨',
  dr1: '∨',
  dr2: '∨',
  il: '→',
  fil: '→',
  ir: '→',
  fdl: '∨',
}

type GazeHintsForKind = {
  immediateRule: RuleId | null
  eventualRule: RuleId | null
  hintChar: string
}

type GazeHintInfo = {
  connective: GazeHintsForKind | null
  weakening: GazeHintsForKind | null
}

const gazeHintBadgeForKind = (
  key: RuleId,
  hints: GazeHintsForKind | null,
): HTMLElement | null => {
  if (!hints) return null
  if (key === hints.immediateRule) {
    return keyHintBadge(hints.hintChar, 'cold')
  }
  if (
    key === hints.eventualRule &&
    hints.eventualRule !== hints.immediateRule
  ) {
    return keyHintBadge(hints.hintChar, 'coldGhost')
  }
  return null
}

const createPanel = <K extends RuleId>(
  className: string,
  ruleRecord: Record<K, Rule<AnySequent>>,
  ls: ReadonlyArray<RuleId>,
  rules: ReadonlyArray<RuleId>,
  solved: boolean,
  onApply: (key: RuleId) => void,
  gazeHints: GazeHintInfo,
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
    const ruleHintVariant = className === 'main' ? 'base' : 'hot'
    if (hint !== undefined) pre.appendChild(keyHintBadge(hint, ruleHintVariant))
    const gazeBadges = [
      gazeHintBadgeForKind(key, gazeHints.connective),
      gazeHintBadgeForKind(key, gazeHints.weakening),
    ].filter(isNonNullable)
    if (gazeBadges.length > 0) {
      const stack = document.createElement('span')
      stack.setAttribute('class', 'gaze-hint-stack')
      for (const b of gazeBadges) stack.appendChild(b)
      pre.appendChild(stack)
    }
    panel.appendChild(pre)
  })
  return panel
}

export const createBench = (
  workspace: AnyWorkspace,
  makeCongrats: () => { hurray: HTMLElement; buttons: HTMLElement },
  controlsEl: HTMLElement,
  rerender: () => void,
): HTMLElement => {
  const ls = workspace.applicableRules()
  const rules = workspace.availableRules()
  const solved = workspace.isSolved()
  const focus = workspace.currentConjecture()
  const activeDeriv = subDerivation(focus.derivation, activePath(focus))
  const branchClosed = activeDeriv?.kind === 'transformation'
  const inactive = solved || branchClosed

  const apply = (key: RuleId) => {
    if (gazeModeActive) gazeModeActive = false
    if (isReverseId0(key)) workspace.applyEvent(reverse0(key))
    rerender()
  }
  const applyCenter = (key: RuleId) => {
    if (gazeModeActive) gazeModeActive = false
    if (isReverseId0(key)) workspace.applyEvent(reverse0(key))
    rerender()
  }

  const seq = activeSequent(workspace.currentConjecture())
  const available = workspace.availableRules()
  const buildKindHints = (
    kind: 'connective' | 'weakening',
    hintChar: string | undefined,
  ): GazeHintsForKind | null => {
    if (hintChar === undefined) return null
    const chain = computeGhostChain(seq, workspace.gaze(), kind, available)
    if (!chain || chain.length === 0) return null
    return {
      immediateRule: chain[0]?.rule ?? null,
      eventualRule: chain[chain.length - 1]?.rule ?? null,
      hintChar,
    }
  }
  const gazeHints: GazeHintInfo = gazeModeActive
    ? {
        connective: buildKindHints(
          'connective',
          actionKeyHint['gazeConnective'],
        ),
        weakening: buildKindHints('weakening', actionKeyHint['gazeWeakening']),
      }
    : { connective: null, weakening: null }

  const hideRules = !rulesVisible || solved
  const panel = document.createElement('div')
  panel.setAttribute('class', 'bench' + (hideRules ? ' rules-hidden' : ''))
  panel.appendChild(
    createPanel('left', left, ls, rules, inactive, apply, gazeHints),
  )
  const congrats = solved ? makeCongrats() : null
  if (congrats) {
    panel.appendChild(congrats.hurray)
  } else {
    panel.appendChild(
      createPanel('main', center, ls, rules, inactive, applyCenter, gazeHints),
    )
  }
  panel.appendChild(
    createPanel('right', right, ls, rules, inactive, apply, gazeHints),
  )
  panel.appendChild(createPlayArea(workspace))
  const zoomOut = createButton(
    '−',
    false,
    () => {
      zoomTreeOut()
      rerender()
    },
    '-',
  )
  const zoomReset = createButton(
    '⊙',
    false,
    () => {
      zoomTreeReset()
      rerender()
    },
    '0',
  )
  const zoomIn = createButton(
    '+',
    false,
    () => {
      zoomTreeIn()
      rerender()
    },
    '+',
  )
  const gazeMovable =
    !inactive && seq.antecedent.length + seq.succedent.length > 1
  const leftDisabled = gazeModeActive
    ? !gazeMovable
    : inactive || seq.antecedent.length === 0
  const rightDisabled = gazeModeActive
    ? !gazeMovable
    : inactive || seq.succedent.length === 0
  const gazeLeftBtn = createButton(
    'Left',
    leftDisabled,
    () => {
      if (!gazeModeActive) {
        gazeModeActive = true
        workspace.setGaze({
          side: 'left',
          index: seq.antecedent.length - 1,
        })
      } else {
        workspace.moveGaze(-1)
      }
      rerender()
    },
    actionKeyHint['gazeLeft'],
  )
  const gazeRightBtn = createButton(
    'Right',
    rightDisabled,
    () => {
      if (!gazeModeActive) {
        gazeModeActive = true
        workspace.setGaze({ side: 'right', index: 0 })
      } else {
        workspace.moveGaze(1)
      }
      rerender()
    },
    actionKeyHint['gazeRight'],
  )
  const gazeWeakeningBtn = createButton(
    'Drop',
    !gazeModeActive || inactive,
    () => {
      workspace.setGazeKind('weakening')
      applyGazeRule(workspace, 'weakening')
      rerender()
    },
    actionKeyHint['gazeWeakening'],
  )
  const connectiveRule = gazeHints.connective?.eventualRule ?? null
  const connectiveLabel =
    connectiveRule !== null ? (ruleConnectiveLabel[connectiveRule] ?? '') : ''
  const connectiveDisabled =
    !gazeModeActive || inactive || connectiveLabel === ''
  const gazeConnectiveBtn = createButton(
    'Destruct',
    connectiveDisabled,
    () => {
      workspace.setGazeKind('connective')
      applyGazeRule(workspace, 'connective')
      rerender()
    },
    actionKeyHint['gazeConnective'],
  )
  const makeGroup = (...cls: string[]): HTMLElement => {
    const g = document.createElement('div')
    g.setAttribute('class', ['controls-group', ...cls].join(' '))
    return g
  }

  const rulesBtn = createButton(
    'Rules',
    false,
    () => {
      rulesVisible = !rulesVisible
      rerender()
    },
    actionKeyHint['toggleRules'],
  )
  rulesBtn.classList.add('toggle')
  const rulesLed = document.createElement('span')
  rulesLed.setAttribute('class', 'led' + (rulesVisible ? ' on' : ''))
  rulesBtn.appendChild(rulesLed)
  const axiomBtn = createButton(
    'Axiom',
    inactive || !keys(center).some((k) => ls.includes(k)),
    () => {
      autoRule(workspace, keys(center))
      rerender()
    },
    actionKeyHint['axiom'],
  )

  const gazeGroup = makeGroup(...(gazeModeActive ? ['gaze'] : []))
  gazeGroup.appendChild(gazeLeftBtn)
  gazeGroup.appendChild(gazeWeakeningBtn)
  gazeGroup.appendChild(gazeConnectiveBtn)
  gazeGroup.appendChild(gazeRightBtn)

  const rulesGroup = makeGroup()
  rulesGroup.appendChild(rulesBtn)

  const axiomGroup = makeGroup()
  axiomGroup.appendChild(axiomBtn)

  const zoomGroup = makeGroup()
  zoomGroup.appendChild(zoomOut)
  zoomGroup.appendChild(zoomReset)
  zoomGroup.appendChild(zoomIn)

  controlsEl.setAttribute('class', 'controls-group')

  const centerCell = document.createElement('div')
  centerCell.setAttribute('class', 'controls-center')

  const branchCount = branches(workspace.currentConjecture().derivation).length
  const canSwitch = !solved && branchCount > 1
  const prevBranchBtn = createButton(
    '↰',
    !canSwitch,
    () => {
      workspace.applyEvent(prevBranch())
      rerender()
    },
    actionKeyHint['prevBranch'],
  )
  const nextBranchBtn = createButton(
    '↱',
    !canSwitch,
    () => {
      workspace.applyEvent(nextBranch())
      rerender()
    },
    actionKeyHint['nextBranch'],
  )
  const branchGroup = makeGroup()
  branchGroup.appendChild(prevBranchBtn)
  branchGroup.appendChild(nextBranchBtn)

  const rightCell = document.createElement('div')
  rightCell.setAttribute('class', 'controls-right')
  rightCell.appendChild(branchGroup)
  rightCell.appendChild(zoomGroup)

  const controlsBar = document.createElement('div')
  controlsBar.setAttribute('class', 'controls')
  if (congrats) {
    congrats.buttons.setAttribute('class', 'congrabuttons controls-group')
    centerCell.appendChild(congrats.buttons)
  } else {
    centerCell.appendChild(rulesGroup)
    centerCell.appendChild(gazeGroup)
    centerCell.appendChild(axiomGroup)
  }
  controlsBar.appendChild(controlsEl)
  controlsBar.appendChild(centerCell)
  controlsBar.appendChild(rightCell)
  panel.appendChild(controlsBar)
  return panel
}

const autoRule = (workspace: AnyWorkspace, rules: RuleId[]) => {
  const available = workspace.applicableRules()
  const [first] = rules.filter((rule) => available.includes(rule))
  if (!first) return
  if (isReverseId0(first)) workspace.applyEvent(reverse0(first))
}

export const createPausePopup = (
  onResume: () => void,
  onExit: () => void,
  onReset: () => void,
  resetDisabled: boolean,
): HTMLElement => {
  const shroud = document.createElement('div')
  shroud.setAttribute('class', 'shroud pause-shroud')
  shroud.onclick = (ev) => {
    if (ev.target === shroud) {
      ev.preventDefault()
      onResume()
    }
  }
  const panel = document.createElement('div')
  panel.setAttribute('class', 'pause-popup')
  panel.onclick = (ev) => {
    ev.stopPropagation()
  }
  const title = document.createElement('div')
  title.setAttribute('class', 'pause-title')
  title.textContent = 'Paused'
  panel.appendChild(title)
  const buttons = document.createElement('div')
  buttons.setAttribute('class', 'pause-buttons')
  buttons.appendChild(
    createButton('Resume game', false, onResume, actionKeyHint['menu']),
  )
  buttons.appendChild(
    createButton(
      'Reset challenge',
      resetDisabled,
      onReset,
      actionKeyHint['reset'],
    ),
  )
  buttons.appendChild(
    createButton('Exit to main menu', false, onExit, actionKeyHint['exit']),
  )
  panel.appendChild(buttons)
  shroud.appendChild(panel)
  return shroud
}

const RULE_APPLY_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'leftWeakening',
  'leftConnective',
  'leftRotateLeft',
  'leftRotateRight',
  'rightWeakening',
  'rightConnective',
  'rightRotateLeft',
  'rightRotateRight',
])

export const createDispatch =
  (
    getWorkspace: () => AnyWorkspace,
    rerender: () => void,
    navigate: Navigate,
    onSolved: (action: Action) => void,
    onLevel?: () => void,
    onMenu?: () => void,
  ) =>
  (action: Action): void => {
    if (action === 'gazeLeft' || action === 'gazeRight') {
      if (!gazeModeActive) {
        const workspace = getWorkspace()
        const seq = activeSequent(workspace.currentConjecture())
        if (action === 'gazeLeft') {
          if (seq.antecedent.length === 0) return
          gazeModeActive = true
          workspace.setGaze({
            side: 'left',
            index: seq.antecedent.length - 1,
          })
        } else {
          if (seq.succedent.length === 0) return
          gazeModeActive = true
          workspace.setGaze({ side: 'right', index: 0 })
        }
        rerender()
        return
      }
    } else if (action === 'gazeConnective' || action === 'gazeWeakening') {
      if (!gazeModeActive) return
    } else if (
      gazeModeActive &&
      (RULE_APPLY_ACTIONS.has(action) || action === 'reset')
    ) {
      gazeModeActive = false
    } else if (action === 'undo' && gazeModeActive) {
      if (activePath(getWorkspace().currentConjecture()).length === 0) {
        gazeModeActive = false
      }
    }
    if (action === 'menu') {
      if (onMenu) onMenu()
      else navigate('menu')
      return
    }
    if (action === 'level') {
      onLevel?.()
      return
    }
    if (action === 'toggleRules') {
      rulesVisible = !rulesVisible
      rerender()
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
    const focusState = workspace.currentConjecture()
    const activeDeriv = subDerivation(
      focusState.derivation,
      activePath(focusState),
    )
    const onClosedBranch = activeDeriv?.kind === 'transformation'
    if (
      onClosedBranch &&
      action !== 'prevBranch' &&
      action !== 'nextBranch' &&
      action !== 'undo'
    ) {
      rerender()
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
  const available = workspace.availableRules()
  const chain = computeGhostChain(seq, gaze, kind, available)
  if (!chain || chain.length === 0) return
  const ant = seq.antecedent.length
  const suc = seq.succedent.length
  if (gaze.side === 'left') {
    if (ant === 0) return
    const activeIndex = ant - 1
    if (gaze.index === activeIndex) {
      if (kind === 'connective') {
        autoRule(workspace, keys(leftLogical))
      } else {
        if (!available.includes('swl')) return
        workspace.applyEvent(reverse0('swl'))
      }
      return
    }
    if (!available.includes('sRotLB')) return
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
        if (!available.includes('swr')) return
        workspace.applyEvent(reverse0('swr'))
      }
      return
    }
    if (!available.includes('sRotRB')) return
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
