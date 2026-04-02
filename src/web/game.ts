import { reverse0, undo, reset } from '../interactive/event'
import { activeSequent, activePath } from '../interactive/focus'
import { AnyDerivation } from '../model/derivation'
import { Rule } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { basic, fromDerivation, fromFocus, fromSequent } from '../render/print'
import { RuleId } from '../model/rule'
import { Configuration } from '../model/challenge'
import {
  center,
  isReverseId0,
  left,
  leftLogical,
  right,
  rightLogical,
} from '../rules'
import { entries, keys } from '../utils/record'
import { Workspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import { Navigate } from './types'

export type AnyWorkspace = Workspace<string, Record<string, Configuration<AnySequent>>>

export const qwertyKeyMap: Record<KeyboardEvent['code'], Action> = {
  Escape: 'menu',
  Backquote: 'level',
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
  il: 'leftConnective',
  swr: 'rightWeakening',
  sRotRB: 'rightRotateLeft',
  sRotRF: 'rightRotateRight',
  nr: 'rightConnective',
  dr: 'rightConnective',
  dr1: 'rightConnective',
  dr2: 'rightConnective',
  cr: 'rightConnective',
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

const createProof = (workspace: AnyWorkspace): HTMLElement => {
  const pre = document.createElement('pre')
  pre.setAttribute('class', 'proof')
  const s = workspace.currentConjecture()
  if (s.derivation.kind === 'transformation') {
    pre.innerHTML = '\n' + fromFocus(s) + '\n'
  }
  return pre
}

const createPlayArea = (
  workspace: AnyWorkspace,
  makeCongrats: () => HTMLElement,
): HTMLElement => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'playarea')
  if (workspace.isSolved()) {
    panel.appendChild(makeCongrats())
  } else {
    const active = document.createElement('div')
    active.setAttribute('class', 'current')
    active.innerHTML = fromSequent(activeSequent(workspace.currentConjecture()))(basic)
    panel.appendChild(active)
  }
  panel.appendChild(createProof(workspace))
  return panel
}

const createPanel = (
  className: string,
  ruleRecord: Partial<Record<RuleId, Rule<AnySequent>>>,
  ls: RuleId[],
  rules: RuleId[],
  solved: boolean,
  onApply: (key: RuleId) => void,
): HTMLElement => {
  const panel = document.createElement('div')
  panel.setAttribute('class', className)
  ;(Object.entries(ruleRecord) as Array<[RuleId, Rule<AnySequent> | undefined]>).forEach(
    ([key, rule]) => {
      if (!rule || !rules.includes(key)) return
      const disabled = solved || !ls.includes(key)
      const pre = document.createElement('pre')
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      if (!disabled) pre.onclick = () => onApply(key)
      pre.innerHTML = fromDerivation(rule.example)
      const action = ruleAction[key]
      const hint = action !== undefined ? actionKeyHint[action] : undefined
      if (hint !== undefined) pre.appendChild(keyHintBadge(hint))
      panel.appendChild(pre)
    },
  )
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
  panel.appendChild(createPanel('main', center, ls, rules, solved, applyCenter))
  panel.appendChild(createPanel('right', right, ls, rules, solved, apply))
  panel.appendChild(createPlayArea(workspace, makeCongrats))
  panel.appendChild(controlsEl)
  return panel
}

const autoRule = (workspace: AnyWorkspace, rules: RuleId[]) => {
  const available = workspace.applicableRules()
  const [first] = rules.filter((rule) => available.includes(rule))
  if (!first) return
  if (isReverseId0(first)) workspace.applyEvent(reverse0(first))
}

export const createDispatch = (
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
      case 'axiom':
        autoRule(workspace, keys(center))
        break
      case 'undo':
        workspace.applyEvent(undo())
        break
    }
    rerender()
  }

export const setupGamepad = (dispatch: (action: Action) => void): (() => void) => {
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
