import {
  Draft,
  draftConjunction,
  draftDisjunction,
  draftImplication,
  draftNegation,
  fillLeftmost,
  hole,
  isComplete,
  toProp,
} from '../model/draft'
import { Prop, atom, falsum, verum } from '../model/prop'
import { basic, fromAtom } from '../render/print'
import * as segment from '../render/segment'
import { t } from './i18n'

// Inline Lemma editor: owns the hole-filling Draft buffer while the player
// builds a cut formula. While a session is live the bottom bar is replaced by
// createLemmaEditorBar and the play area shows the reverse-cut pre-split as a
// ghost; the proof itself is untouched until confirm.

export type LemmaEditorSession = {
  draft: () => Draft
  canUndo: () => boolean
  fill: (piece: Draft) => boolean
  undo: () => boolean
  confirm: () => boolean
  cancel: () => void
}

export const createLemmaEditorSession = (
  onConfirm: (formula: Prop) => void,
  onCancel: () => void,
): LemmaEditorSession => {
  let current: Draft = hole
  let history: ReadonlyArray<Draft> = []
  return {
    draft: () => current,
    canUndo: () => history.length > 0,
    fill: (piece) => {
      const next = fillLeftmost(current, piece)
      if (next === null) return false
      history = [...history, current]
      current = next
      return true
    },
    undo: () => {
      const prev = history[history.length - 1]
      if (prev === undefined) return false
      current = prev
      history = history.slice(0, -1)
      return true
    },
    confirm: () => {
      const formula = toProp(current)
      if (formula === null) return false
      onConfirm(formula)
      return true
    },
    cancel: onCancel,
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

// The editor bar mirrors the play bar's slots: Cancel sits in the Skip
// corner, Undo in its usual place, Confirm in the Axiom slot, and the palette
// occupies the gaze group's space — grouped by kind and arity (atoms,
// constants, negation, binaries) with stable positions.
export const createLemmaEditorBar = (
  session: LemmaEditorSession,
  rerender: () => void,
): HTMLElement => {
  const bar = document.createElement('div')
  bar.setAttribute('class', 'controls lemma-editor')

  const group = (...cls: string[]): HTMLElement => {
    const g = document.createElement('div')
    g.setAttribute('class', ['controls-group', ...cls].join(' '))
    bar.appendChild(g)
    return g
  }

  const full = isComplete(session.draft())

  const fillWith = (piece: () => Draft) => () => {
    if (session.fill(piece())) rerender()
  }

  // Only Confirm mutates the proof; everything else touches the draft at
  // most, so the whole palette wears the inert border.
  const inert = (btn: HTMLPreElement): HTMLPreElement => {
    btn.classList.add('inert')
    return btn
  }

  const miscGroup = group('controls-misc')
  miscGroup.appendChild(
    inert(
      makeButton(t('back'), false, () => {
        session.cancel()
      }),
    ),
  )

  const navGroup = group('controls-nav')
  navGroup.appendChild(
    inert(
      makeButton(t('undo'), !session.canUndo(), () => {
        if (session.undo()) rerender()
      }),
    ),
  )
  const confirmBtn = makeButton(t('lemmaConfirm'), !full, () => {
    session.confirm()
  })
  confirmBtn.classList.add('mutating')
  navGroup.appendChild(confirmBtn)

  const atomGroup = group('lemma-palette')
  for (const name of ['p', 'q', 'r', 's', 'u', 'v'] as const) {
    atomGroup.appendChild(
      inert(
        makeButton(
          segment.html(fromAtom(atom(name))(basic)),
          full,
          fillWith(() => atom(name)),
        ),
      ),
    )
  }

  const constGroup = group('lemma-palette')
  constGroup.appendChild(
    inert(
      makeButton(
        '⊥',
        full,
        fillWith(() => falsum),
      ),
    ),
  )
  constGroup.appendChild(
    inert(
      makeButton(
        '⊤',
        full,
        fillWith(() => verum),
      ),
    ),
  )

  const negGroup = group('lemma-palette')
  negGroup.appendChild(
    inert(
      makeButton(
        '¬',
        full,
        fillWith(() => draftNegation(hole)),
      ),
    ),
  )

  const binGroup = group('lemma-palette')
  binGroup.appendChild(
    inert(
      makeButton(
        '∧',
        full,
        fillWith(() => draftConjunction(hole, hole)),
      ),
    ),
  )
  binGroup.appendChild(
    inert(
      makeButton(
        '∨',
        full,
        fillWith(() => draftDisjunction(hole, hole)),
      ),
    ),
  )
  binGroup.appendChild(
    inert(
      makeButton(
        '→',
        full,
        fillWith(() => draftImplication(hole, hole)),
      ),
    ),
  )

  return bar
}
