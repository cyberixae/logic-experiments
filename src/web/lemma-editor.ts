import {
  Draft,
  draftConjunction,
  draftDisjunction,
  draftImplication,
  draftNegation,
  fillOrWrap,
  hole,
  isComplete,
  toProp,
} from '../model/draft'
import { Prop, atom, falsum, verum } from '../model/prop'
import type { Action } from '../interactive/action'
import { basic, fromAtom } from '../render/print'
import * as segment from '../render/segment'
import { t } from './i18n'

// Inline Lemma editor: owns the hole-filling Draft buffer while the player
// builds a cut formula. While a session is live the bottom bar is replaced by
// createLemmaEditorBar and the play area shows the reverse-cut pre-split as a
// ghost; the proof itself is untouched until confirm.
//
// The bar is rebuilt on every rerender, so the keyboard/gamepad cursor lives
// in the session (an index into the fixed cell list below), not in the DOM.
// Keyboard and gamepad share the cursor — arrows / D-pad move, Enter / Cross
// activate, branch binds jump groups — because it is easier to learn and
// closest to gaze behaviour; the direct keys below are the pro layer on top.

// The bar's cells in display order, left to right in temporal order:
// escape → build → take back → commit.
type CellSpec =
  | { kind: 'cancel'; group: number }
  | {
      kind: 'fill'
      group: number
      label: string
      piece: () => Draft
      leaf: boolean
    }
  | { kind: 'undo'; group: number }
  | { kind: 'confirm'; group: number }

const atomNames = ['p', 'q', 'r', 's', 'u', 'v'] as const

const cellSpecs: ReadonlyArray<CellSpec> = [
  { kind: 'cancel', group: 0 },
  ...atomNames.map(
    (name): CellSpec => ({
      kind: 'fill',
      group: 1,
      label: segment.html(fromAtom(atom(name))(basic)),
      piece: () => atom(name),
      leaf: true,
    }),
  ),
  { kind: 'fill', group: 2, label: '⊥', piece: () => falsum, leaf: true },
  { kind: 'fill', group: 2, label: '⊤', piece: () => verum, leaf: true },
  {
    kind: 'fill',
    group: 3,
    label: '¬',
    piece: () => draftNegation(hole),
    leaf: false,
  },
  {
    kind: 'fill',
    group: 4,
    label: '∧',
    piece: () => draftConjunction(hole, hole),
    leaf: false,
  },
  {
    kind: 'fill',
    group: 4,
    label: '∨',
    piece: () => draftDisjunction(hole, hole),
    leaf: false,
  },
  {
    kind: 'fill',
    group: 4,
    label: '→',
    piece: () => draftImplication(hole, hole),
    leaf: false,
  },
  { kind: 'undo', group: 5 },
  { kind: 'confirm', group: 6 },
]

// Where the cursor appears on its revealing press: the first atom.
const REVEAL_INDEX = 1

const lastGroup = cellSpecs[cellSpecs.length - 1]?.group ?? 0

const firstIndexOfGroup = (g: number): number => {
  const i = cellSpecs.findIndex((c) => c.group === g)
  return i < 0 ? 0 : i
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))

// Pro layer: direct keys while the editor is open. Digits map to atom slots
// positionally; the operators reuse the six proof-move keys (inert during
// editing) in mirrored dual pairs — f/j the lattice duals, g/h the constant
// duals, s/l the outer pair.
export const editorKeyPieces: Readonly<Record<string, () => Draft>> = {
  Digit1: () => atom('p'),
  Digit2: () => atom('q'),
  Digit3: () => atom('r'),
  Digit4: () => atom('s'),
  Digit5: () => atom('u'),
  Digit6: () => atom('v'),
  KeyS: () => draftNegation(hole),
  KeyF: () => draftConjunction(hole, hole),
  KeyG: () => falsum,
  KeyH: () => verum,
  KeyJ: () => draftDisjunction(hole, hole),
  KeyL: () => draftImplication(hole, hole),
}

export type LemmaEditorSession = {
  draft: () => Draft
  canUndo: () => boolean
  fill: (piece: Draft) => boolean
  undo: () => boolean
  confirm: () => boolean
  cancel: () => void
  cursor: () => number | null
  // Cursor navigation and activation for keyboard/gamepad. Returns true when
  // the press changed editor state and the caller should rerender; confirm
  // and cancel trigger their own rerender through the session callbacks.
  handleAction: (action: Action) => boolean
}

export const createLemmaEditorSession = (
  onConfirm: (formula: Prop) => void,
  onCancel: () => void,
): LemmaEditorSession => {
  let current: Draft = hole
  let history: ReadonlyArray<Draft> = []
  let cursorIndex: number | null = null

  const fill = (piece: Draft): boolean => {
    const next = fillOrWrap(current, piece)
    if (next === null) return false
    history = [...history, current]
    current = next
    return true
  }

  const undo = (): boolean => {
    const prev = history[history.length - 1]
    if (prev === undefined) return false
    current = prev
    history = history.slice(0, -1)
    return true
  }

  const confirm = (): boolean => {
    const formula = toProp(current)
    if (formula === null) return false
    onConfirm(formula)
    return true
  }

  // The first navigation press reveals the cursor and is consumed by the
  // reveal, mirroring createButtonCursor, so pure pointer players never see
  // a highlight they didn't ask for.
  const reveal = (): boolean => {
    if (cursorIndex !== null) return false
    cursorIndex = REVEAL_INDEX
    return true
  }

  const moveCursor = (delta: number): boolean => {
    if (reveal()) return true
    if (cursorIndex === null) return false
    cursorIndex = clamp(cursorIndex + delta, 0, cellSpecs.length - 1)
    return true
  }

  const groupJump = (dir: number): boolean => {
    if (reveal()) return true
    if (cursorIndex === null) return false
    const g = cellSpecs[cursorIndex]?.group ?? 0
    cursorIndex = firstIndexOfGroup(clamp(g + dir, 0, lastGroup))
    return true
  }

  const activate = (): boolean => {
    if (reveal()) return true
    if (cursorIndex === null) return false
    const spec = cellSpecs[cursorIndex]
    if (spec === undefined) return false
    switch (spec.kind) {
      case 'cancel':
        onCancel()
        return false
      case 'fill':
        return fill(spec.piece())
      case 'undo':
        return undo()
      case 'confirm':
        confirm()
        return false
    }
  }

  const handleAction = (action: Action): boolean => {
    switch (action) {
      case 'gazeLeft':
      case 'leftRotateLeft':
        return moveCursor(-1)
      case 'gazeRight':
      case 'leftRotateRight':
        return moveCursor(1)
      case 'prevBranch':
        return groupJump(-1)
      case 'nextBranch':
        return groupJump(1)
      case 'axiom':
        return activate()
      default:
        return false
    }
  }

  return {
    draft: () => current,
    canUndo: () => history.length > 0,
    fill,
    undo,
    confirm,
    cancel: onCancel,
    cursor: () => cursorIndex,
    handleAction,
  }
}

const makeButton = (
  label: string,
  disabled: boolean,
  onClick: () => void,
): HTMLPreElement => {
  const btn = document.createElement('pre')
  btn.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
  btn.innerHTML = label
  if (!disabled) btn.onclick = onClick
  return btn
}

// The play bar's group underline colors are an operand map (branch cursor,
// gaze cursor, challenge) that doesn't exist in editor mode, so every editor
// group stays the neutral default. Spacing carries the kind/arity grouping;
// the inert/mutating button borders carry the commit distinction.
export const createLemmaEditorBar = (
  session: LemmaEditorSession,
  rerender: () => void,
): HTMLElement => {
  const bar = document.createElement('div')
  bar.setAttribute('class', 'controls lemma-editor')

  const full = isComplete(session.draft())
  const cursor = session.cursor()

  let groupEl: HTMLElement | null = null
  let groupNo = -1

  cellSpecs.forEach((spec, i) => {
    if (spec.group !== groupNo) {
      groupNo = spec.group
      groupEl = document.createElement('div')
      const palette = spec.kind === 'fill' ? ' lemma-palette' : ''
      groupEl.setAttribute('class', 'controls-group' + palette)
      bar.appendChild(groupEl)
    }
    const btn = ((): HTMLPreElement => {
      switch (spec.kind) {
        case 'cancel': {
          const b = makeButton(t('back'), false, () => {
            session.cancel()
          })
          b.classList.add('inert')
          return b
        }
        case 'fill': {
          // Leaves dim on a complete draft; operators stay live since they
          // wrap it at the root (fillOrWrap).
          const b = makeButton(spec.label, spec.leaf && full, () => {
            if (session.fill(spec.piece())) rerender()
          })
          b.classList.add('inert')
          return b
        }
        case 'undo': {
          const b = makeButton(t('undo'), !session.canUndo(), () => {
            if (session.undo()) rerender()
          })
          b.classList.add('inert')
          return b
        }
        case 'confirm': {
          const b = makeButton(t('lemmaConfirm'), !full, () => {
            session.confirm()
          })
          b.classList.add('mutating')
          return b
        }
      }
    })()
    if (cursor === i) btn.classList.add('cursor')
    groupEl?.appendChild(btn)
  })

  return bar
}
