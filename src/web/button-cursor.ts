import type { Action } from '../interactive/action'

// A focusable button: its activation handler and an optional enablement
// predicate, so on-screen click handlers and the keyboard / gamepad cursor share
// one source of truth.
export type CursorCell = {
  btn: HTMLElement
  activate: () => void
  isEnabled?: () => boolean
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))

// The actions the cursor treats as movement: the gaze arrows plus the hot-mode
// D-pad aliases. Callers that overlay a cursor on a screen with its own key
// handling use this to route only navigation through the cursor.
export const cursorNavActions: ReadonlySet<Action> = new Set<Action>([
  'gazeLeft',
  'gazeRight',
  'gazeConnective',
  'gazeWeakening',
  'leftRotateLeft',
  'leftRotateRight',
  'leftConnective',
  'leftWeakening',
])

// A keyboard / gamepad cursor over a grid of buttons, mirroring the lemma
// builder. Hidden until the first navigation action so pure mouse / touch
// players never see a highlight they didn't ask for. Caller arranges cells into
// rows; navigation clamps within the grid and the focused button gets the
// `cursor` class.
//
// Arrow keys / D-pad drive the cursor via the gaze actions; the left* aliases
// keep the D-pad usable even when a gamepad is in "hot" mode, which otherwise
// remaps the D-pad away from gaze. axiom (Enter / Space / Cross / R2) activates
// the focused button.
export const createButtonCursor = (
  rows: ReadonlyArray<ReadonlyArray<CursorCell>>,
): {
  onAction: (action: Action) => void
  refresh: () => void
  isEngaged: () => boolean
} => {
  let row = 0
  let col = 0
  let visible = false

  const refresh = (): void => {
    for (const r of rows) {
      for (const cell of r) cell.btn.classList.remove('cursor')
    }
    const focused = visible ? rows[row]?.[col] : undefined
    if (focused !== undefined) focused.btn.classList.add('cursor')
  }

  const reveal = (): boolean => {
    if (visible) return false
    visible = true
    row = 0
    col = 0
    refresh()
    return true
  }

  const move = (dRow: number, dCol: number): void => {
    // The first navigation action only reveals the cursor at a sensible start.
    if (reveal()) return
    row = clamp(row + dRow, 0, rows.length - 1)
    const r = rows[row]
    if (r !== undefined) col = clamp(col + dCol, 0, r.length - 1)
    refresh()
  }

  const activate = (): void => {
    if (reveal()) return
    const cell = rows[row]?.[col]
    if (cell !== undefined && (cell.isEnabled?.() ?? true)) cell.activate()
  }

  const onAction = (action: Action): void => {
    switch (action) {
      case 'gazeLeft':
      case 'leftRotateLeft':
        move(0, -1)
        break
      case 'gazeRight':
      case 'leftRotateRight':
        move(0, 1)
        break
      case 'gazeConnective':
      case 'leftConnective':
        move(-1, 0)
        break
      case 'gazeWeakening':
      case 'leftWeakening':
        move(1, 0)
        break
      case 'axiom':
        activate()
        break
    }
  }

  // Whether the cursor has been revealed by a navigation action — lets callers
  // keep a default activation key (e.g. a screen where axiom does something
  // specific until the player starts navigating).
  const isEngaged = (): boolean => visible

  return { onAction, refresh, isEngaged }
}
