import { Action } from '../interactive/action'

// === Keyboard mapping ===

export const qwertyKeyMap: Record<KeyboardEvent['code'], Action> = {
  KeyM: 'menu',
  Escape: 'menu',
  KeyX: 'exit',
  Backquote: 'level',
  KeyW: 'prevBranch',
  KeyO: 'nextBranch',
  KeyA: 'leftRotateLeft',
  KeyS: 'leftWeakening',
  KeyF: 'leftConnective',
  KeyG: 'leftRotateRight',
  KeyH: 'rightRotateLeft',
  KeyJ: 'rightConnective',
  KeyL: 'rightWeakening',
  KeyC: 'lemma',
  Space: 'axiom',
  Enter: 'axiom',
  Backspace: 'undo',
  ArrowLeft: 'gazeLeft',
  ArrowRight: 'gazeRight',
  ArrowUp: 'gazeConnective',
  ArrowDown: 'gazeWeakening',
  KeyR: 'toggleRules',
  KeyN: 'skip',
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
const actionKeyHint: Partial<Record<Action, string>> = {}
for (const [code, action] of Object.entries(qwertyKeyMap)) {
  if (!(action in actionKeyHint)) {
    actionKeyHint[action] = codeToLabel(code)
  }
}

// === Gamepad button maps ===

// Buttons whose meaning is the same in both gaze and hot mode.
const ps5SharedKeyMap: Record<number, Action> = {
  4: 'prevBranch', // L1
  5: 'nextBranch', // R1
  6: 'undo', // L2
  7: 'axiom', // R2
  9: 'menu', // Options
}

// Gaze mode (default): D-pad navigates the cursor; face buttons confirm/cancel.
export const ps5GazeKeyMap: Record<number, Action> = {
  ...ps5SharedKeyMap,
  0: 'axiom', // Cross — alias for muscle memory
  1: 'undo', // Circle — alias
  2: 'lemma', // Square
  3: 'skip', // Triangle
  12: 'gazeConnective', // D-pad up
  13: 'gazeWeakening', // D-pad down
  14: 'gazeLeft', // D-pad left
  15: 'gazeRight', // D-pad right
}

// Hot mode: D-pad applies left rules; face buttons apply right rules. Mirrors
// the keyboard ASFG / HJL; row geometrically (up/down = connective/weakening on
// both hands; horizontal = rotation, outer→inner).
export const ps5HotKeyMap: Record<number, Action> = {
  ...ps5SharedKeyMap,
  0: 'rightWeakening', // Cross   ↔ L
  2: 'rightRotateLeft', // Square  ↔ H
  3: 'rightConnective', // Triangle ↔ J
  12: 'leftConnective', // D-pad up    ↔ F
  13: 'leftWeakening', // D-pad down  ↔ S
  14: 'leftRotateLeft', // D-pad left  ↔ A
  15: 'leftRotateRight', // D-pad right ↔ G
}

const padIndexToLabel: Record<number, string> = {
  0: '✕',
  1: '◯',
  2: '□',
  3: '△',
  4: 'L1',
  5: 'R1',
  6: 'L2',
  7: 'R2',
  9: '☰',
  10: 'L3',
  11: 'R3',
  12: '↑',
  13: '↓',
  14: '←',
  15: '→',
}

const buildActionPadHint = (
  keyMap: Record<number, Action>,
): Partial<Record<Action, string>> => {
  const hint: Partial<Record<Action, string>> = {}
  for (const [idx, action] of Object.entries(keyMap)) {
    const label = padIndexToLabel[Number(idx)]
    if (label !== undefined && !(action in hint)) {
      hint[action] = label
    }
  }
  return hint
}

const actionPadHintGaze = buildActionPadHint(ps5GazeKeyMap)
const actionPadHintHot = buildActionPadHint(ps5HotKeyMap)

// === Mode state ===

type ActiveInput = 'pointer' | 'keyboard' | 'gamepad'

// The device the player most recently used. Drives both hint text (keyboard
// letters vs gamepad glyphs) and — via the `input-*` html class — whether the
// single-player on-screen control bar is shown. Defaults to 'pointer' so the
// buttons are visible on first paint and on touch devices.
let activeInput: ActiveInput = 'pointer'
let hotMode = false
let gazeModeActive = false
const gamepadListeners = new Set<() => void>()

export const isGamepadActive = (): boolean => activeInput === 'gamepad'
export const isHotMode = (): boolean => hotMode
export const isGazeModeActive = (): boolean => gazeModeActive

export const subscribeGamepad = (cb: () => void): (() => void) => {
  gamepadListeners.add(cb)
  return () => {
    gamepadListeners.delete(cb)
  }
}

const notifyGamepadListeners = (): void => {
  for (const cb of gamepadListeners) cb()
}

// Selectors used by the polling loop and hint accessors.
export const activePadKeyMap = (): Record<number, Action> =>
  hotMode ? ps5HotKeyMap : ps5GazeKeyMap

const activeActionPadHint = (): Partial<Record<Action, string>> =>
  hotMode ? actionPadHintHot : actionPadHintGaze

// === Mode setters ===

const inputClass: Record<ActiveInput, string> = {
  pointer: 'input-pointer',
  keyboard: 'input-keyboard',
  gamepad: 'input-gamepad',
}

const setActiveInput = (v: ActiveInput): void => {
  if (activeInput === v) return
  const wasGamepad = activeInput === 'gamepad'
  activeInput = v
  if (typeof document !== 'undefined') {
    const el = document.documentElement
    el.classList.remove('input-pointer', 'input-keyboard', 'input-gamepad')
    el.classList.add(inputClass[v])
  }
  // Only re-render when the gamepad-ness changes: that's the only thing that
  // alters *rendered* content (pad glyphs vs key letters). Control-bar/topbar
  // visibility is driven purely by the html class via CSS, so a keyboard↔pointer
  // switch needs no re-render — and must not trigger one, or a pointer click
  // that switches modes would wipe the DOM out from under its own click target.
  if (wasGamepad !== (v === 'gamepad')) notifyGamepadListeners()
}

// Reflect the default state on the html element at module init so the
// single-player control bar is visible on first paint and on touch devices.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('input-pointer')
}

// Called from input handlers so the hint display follows the device the player
// is *currently* using, not just whether a controller is plugged in. A player
// who flips between devices gets hints for whichever they touched last.
export const markPointerInput = (): void => setActiveInput('pointer')

export const markKeyboardInput = (): void => {
  setActiveInput('keyboard')
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('keyboard-detected')
  }
}

// Capability check (not viewport), so it doesn't need re-evaluation on resize:
// a device that advertises `(hover: hover) and (pointer: fine)` has a mouse
// and a keyboard, so keyboard hints should be visible from the start.
if (
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches
) {
  document.documentElement.classList.add('keyboard-detected')
}

export const markGamepadInput = (): void => setActiveInput('gamepad')

// Lifecycle entry points used by setupGamepad on connect/disconnect.
export const onGamepadConnected = (): void => setActiveInput('gamepad')
export const onGamepadDisconnected = (): void => setActiveInput('pointer')

export const setGazeModeActive = (active: boolean): void => {
  gazeModeActive = active
  if (active && hotMode) {
    hotMode = false
    notifyGamepadListeners()
  }
}

export const toggleHotMode = (): void => {
  hotMode = !hotMode
  if (hotMode) gazeModeActive = false
  notifyGamepadListeners()
}

// === Hint accessors ===

export const getActionHint = (action: Action): string | undefined =>
  isGamepadActive() ? activeActionPadHint()[action] : actionKeyHint[action]

export const kbdHint = (s: string): string | undefined =>
  isGamepadActive() ? undefined : s

// For buttons whose primary trigger differs between keyboard and gamepad —
// e.g. congrats-screen "New Challenge" is triggered by `'n'` on the keyboard
// but by `axiom` (R2/Cross) on the gamepad. Shows the literal in keyboard
// mode, the pad hint for the given action in pad mode.
export const dualHint = (kbd: string, padAction: Action): string | undefined =>
  isGamepadActive() ? activeActionPadHint()[padAction] : kbd

// Pure variants that take an explicit isGamepad flag instead of reading the
// global activeInput — used by per-bench contexts (e.g. versus mode).
export const getActionHintPure = (
  action: Action,
  isGamepad: boolean,
): string | undefined =>
  isGamepad ? activeActionPadHint()[action] : actionKeyHint[action]

// === Test seam ===

// Resets all module state. Intended for use from tests via `beforeEach`. Not
// for production code paths — production should use the explicit setters.
export const resetInputModeForTest = (): void => {
  activeInput = 'pointer'
  hotMode = false
  gazeModeActive = false
  gamepadListeners.clear()
}
