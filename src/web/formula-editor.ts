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
import { fromAtom, fromProp, basic } from '../render/print'
import * as segment from '../render/segment'
import { t } from './i18n'

type Stack = ReadonlyArray<Prop>

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
): HTMLElement => {
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
  for (const name of atomNames) {
    const a = atom(name)
    const btn = document.createElement('pre')
    btn.setAttribute('class', 'button')
    btn.innerHTML = segment.html(fromAtom(a)(basic))
    btn.onclick = () => {
      pushProp(a)
    }
    atomRow.appendChild(btn)
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
  connRow.appendChild(implBtn)
  connRow.appendChild(conjBtn)
  connRow.appendChild(disjBtn)
  connRow.appendChild(negBtn)
  connRow.appendChild(
    makeBtn('⊥', () => {
      pushProp(falsum)
    }),
  )
  connRow.appendChild(
    makeBtn('⊤', () => {
      pushProp(verum)
    }),
  )
  popup.appendChild(connRow)

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

  const renderState = (): void => {
    stackDisplay.innerHTML =
      stack.length === 0
        ? '—'
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
    if (formula !== undefined) {
      const f = formula
      confirmBtn.onclick = () => {
        onConfirm(f)
      }
    } else {
      confirmBtn.onclick = null
    }
  }

  renderState()
  return shroud
}
