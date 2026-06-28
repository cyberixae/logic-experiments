import {
  atom,
  conjunction,
  disjunction,
  falsum,
  implication,
  negation,
  verum,
} from '../model/prop'
import type { Prop } from '../model/prop'
import type { Action } from '../interactive/action'
import { fromAtom, fromProp, basic } from '../render/print'
import * as segment from '../render/segment'
import { t } from './i18n'
import { createButtonCursor } from './button-cursor'

type Stack = ReadonlyArray<Prop>

// A focusable button in the editor grid. Carries its own activation handler and
// an enablement predicate so the on-screen click handlers and the keyboard /
// gamepad cursor share one source of truth.
type Cell = {
  btn: HTMLPreElement
  activate: () => void
  isEnabled: () => boolean
}

const makeBtn = (label: string, handler: () => void): HTMLPreElement => {
  const btn = document.createElement('pre')
  btn.setAttribute('class', 'button')
  btn.textContent = label
  btn.onclick = handler
  return btn
}

const setDisabled = (
  btn: HTMLPreElement,
  disabled: boolean,
  handler: () => void,
): void => {
  btn.setAttribute('class', disabled ? 'button disabled' : 'button')
  btn.onclick = disabled ? null : handler
}

export const createFormulaEditor = (
  title: string,
  confirmLabel: string,
  onConfirm: (formula: Prop) => void,
  onCancel: () => void,
): {
  el: HTMLElement
  tryUndo: () => boolean
  onAction: (action: Action) => void
} => {
  let stack: Stack = []
  let history: ReadonlyArray<Stack> = []

  const saveAndSet = (next: Stack): void => {
    history = [...history, stack]
    stack = next
    renderState()
  }

  const pushProp = (p: Prop): void => {
    saveAndSet([...stack, p])
  }

  const applyNeg = (): void => {
    const top = stack[stack.length - 1]
    if (top === undefined) return
    saveAndSet([...stack.slice(0, -1), negation(top)])
  }

  const applyBin = (
    op: 'conjunction' | 'disjunction' | 'implication',
  ): void => {
    const right = stack[stack.length - 1]
    const left = stack[stack.length - 2]
    if (right === undefined || left === undefined) return
    const result =
      op === 'conjunction'
        ? conjunction(left, right)
        : op === 'disjunction'
          ? disjunction(left, right)
          : implication(left, right)
    saveAndSet([...stack.slice(0, -2), result])
  }

  const doUndo = (): void => {
    const prev = history[history.length - 1]
    if (prev === undefined) return
    stack = prev
    history = history.slice(0, -1)
    renderState()
  }

  const confirmCurrent = (): void => {
    const formula = stack.length === 1 ? stack[0] : undefined
    if (formula !== undefined) onConfirm(formula)
  }

  const shroud = document.createElement('div')
  shroud.setAttribute('class', 'shroud pause-shroud')
  shroud.onclick = (ev) => {
    if (ev.target === shroud) {
      ev.preventDefault()
      onCancel()
    }
  }

  const popup = document.createElement('div')
  popup.setAttribute('class', 'formula-editor-popup')
  popup.onclick = (ev) => {
    ev.stopPropagation()
  }

  const titleEl = document.createElement('div')
  titleEl.setAttribute('class', 'formula-editor-title')
  titleEl.textContent = title
  popup.appendChild(titleEl)

  const stackDisplay = document.createElement('div')
  stackDisplay.setAttribute('class', 'formula-editor-stack')
  popup.appendChild(stackDisplay)

  const atomRow = document.createElement('div')
  atomRow.setAttribute('class', 'config-toggles')
  const atomNames = ['p', 'q', 'r', 's', 'u', 'v'] as const
  const atomCells: Cell[] = []
  for (const name of atomNames) {
    const a = atom(name)
    const btn = document.createElement('pre')
    btn.setAttribute('class', 'button')
    btn.innerHTML = segment.html(fromAtom(a)(basic))
    const activate = (): void => {
      pushProp(a)
    }
    btn.onclick = activate
    atomRow.appendChild(btn)
    atomCells.push({ btn, activate, isEnabled: () => true })
  }
  popup.appendChild(atomRow)

  const connRow = document.createElement('div')
  connRow.setAttribute('class', 'config-toggles')
  const implBtn = makeBtn('→', () => {
    applyBin('implication')
  })
  const conjBtn = makeBtn('∧', () => {
    applyBin('conjunction')
  })
  const disjBtn = makeBtn('∨', () => {
    applyBin('disjunction')
  })
  const negBtn = makeBtn('¬', () => {
    applyNeg()
  })
  const falsumBtn = makeBtn('⊥', () => {
    pushProp(falsum)
  })
  const verumBtn = makeBtn('⊤', () => {
    pushProp(verum)
  })
  connRow.appendChild(implBtn)
  connRow.appendChild(conjBtn)
  connRow.appendChild(disjBtn)
  connRow.appendChild(negBtn)
  connRow.appendChild(falsumBtn)
  connRow.appendChild(verumBtn)
  popup.appendChild(connRow)

  const connCells: Cell[] = [
    {
      btn: implBtn,
      activate: () => applyBin('implication'),
      isEnabled: () => stack.length >= 2,
    },
    {
      btn: conjBtn,
      activate: () => applyBin('conjunction'),
      isEnabled: () => stack.length >= 2,
    },
    {
      btn: disjBtn,
      activate: () => applyBin('disjunction'),
      isEnabled: () => stack.length >= 2,
    },
    { btn: negBtn, activate: applyNeg, isEnabled: () => stack.length >= 1 },
    { btn: falsumBtn, activate: () => pushProp(falsum), isEnabled: () => true },
    { btn: verumBtn, activate: () => pushProp(verum), isEnabled: () => true },
  ]

  const controls = document.createElement('div')
  controls.setAttribute('class', 'formula-editor-controls')

  const cancelBtn = document.createElement('pre')
  cancelBtn.setAttribute('class', 'button')
  cancelBtn.textContent = t('back')
  cancelBtn.onclick = onCancel
  controls.appendChild(cancelBtn)

  const undoBtn = document.createElement('pre')
  undoBtn.setAttribute('class', 'button')
  undoBtn.textContent = t('undo')
  controls.appendChild(undoBtn)

  const confirmBtn = document.createElement('pre')
  confirmBtn.setAttribute('class', 'button')
  confirmBtn.textContent = confirmLabel
  controls.appendChild(confirmBtn)

  popup.appendChild(controls)
  shroud.appendChild(popup)

  const controlCells: Cell[] = [
    { btn: cancelBtn, activate: onCancel, isEnabled: () => true },
    { btn: undoBtn, activate: doUndo, isEnabled: () => history.length > 0 },
    {
      btn: confirmBtn,
      activate: confirmCurrent,
      isEnabled: () => stack.length === 1,
    },
  ]

  const rows: ReadonlyArray<ReadonlyArray<Cell>> = [
    atomCells,
    connCells,
    controlCells,
  ]

  const cursor = createButtonCursor(rows)

  const renderState = (): void => {
    stackDisplay.innerHTML =
      stack.length === 0
        ? ''
        : stack.map((p) => segment.html(fromProp(p)(basic))).join(' ')

    setDisabled(negBtn, stack.length === 0, () => {
      applyNeg()
    })
    setDisabled(implBtn, stack.length < 2, () => {
      applyBin('implication')
    })
    setDisabled(conjBtn, stack.length < 2, () => {
      applyBin('conjunction')
    })
    setDisabled(disjBtn, stack.length < 2, () => {
      applyBin('disjunction')
    })
    setDisabled(undoBtn, history.length === 0, () => {
      doUndo()
    })

    const formula = stack.length === 1 ? stack[0] : undefined
    confirmBtn.setAttribute(
      'class',
      formula !== undefined ? 'button' : 'button disabled',
    )
    confirmBtn.onclick = formula !== undefined ? confirmCurrent : null

    // Cursor highlight, applied last so it survives the class resets above.
    cursor.refresh()
  }

  renderState()
  return {
    el: shroud,
    onAction: cursor.onAction,
    tryUndo: () => {
      if (history.length === 0) return false
      doUndo()
      return true
    },
  }
}
