import {
  dualHint,
  getActionHint,
  isGamepadActive,
  isGazeModeActive,
  isHotMode,
  kbdHint,
  markGamepadInput,
  markKeyboardInput,
  onGamepadConnected,
  onGamepadDisconnected,
  ps5GazeKeyMap,
  ps5HotKeyMap,
  qwertyKeyMap,
  resetInputModeForTest,
  setGazeModeActive,
  subscribeGamepad,
  toggleHotMode,
} from '../input-mode'

beforeEach(() => {
  resetInputModeForTest()
})

describe('initial state', () => {
  it('starts with no active gamepad, no hot mode, no gaze mode', () => {
    expect(isGamepadActive()).toBe(false)
    expect(isHotMode()).toBe(false)
    expect(isGazeModeActive()).toBe(false)
  })
})

describe('input source tracking', () => {
  it('markGamepadInput activates the gamepad', () => {
    markGamepadInput()
    expect(isGamepadActive()).toBe(true)
  })

  it('markKeyboardInput deactivates the gamepad', () => {
    markGamepadInput()
    markKeyboardInput()
    expect(isGamepadActive()).toBe(false)
  })

  it('alternating sources flip the active flag both ways', () => {
    markGamepadInput()
    expect(isGamepadActive()).toBe(true)
    markKeyboardInput()
    expect(isGamepadActive()).toBe(false)
    markGamepadInput()
    expect(isGamepadActive()).toBe(true)
  })

  it('onGamepadConnected/Disconnected drive the same flag', () => {
    onGamepadConnected()
    expect(isGamepadActive()).toBe(true)
    onGamepadDisconnected()
    expect(isGamepadActive()).toBe(false)
  })
})

describe('gaze mode setter', () => {
  it('setGazeModeActive(true) activates gaze', () => {
    setGazeModeActive(true)
    expect(isGazeModeActive()).toBe(true)
  })

  it('setGazeModeActive(false) deactivates gaze', () => {
    setGazeModeActive(true)
    setGazeModeActive(false)
    expect(isGazeModeActive()).toBe(false)
  })

  it('does not affect hot mode when hot is already off', () => {
    setGazeModeActive(true)
    expect(isHotMode()).toBe(false)
  })
})

describe('toggleHotMode', () => {
  it('toggles the hot mode flag', () => {
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    toggleHotMode()
    expect(isHotMode()).toBe(false)
  })

  it('clears gaze mode when entering hot mode', () => {
    setGazeModeActive(true)
    expect(isGazeModeActive()).toBe(true)
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    expect(isGazeModeActive()).toBe(false)
  })

  it('does not reactivate gaze mode when leaving hot mode', () => {
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    expect(isGazeModeActive()).toBe(false)
    toggleHotMode()
    expect(isHotMode()).toBe(false)
    expect(isGazeModeActive()).toBe(false)
  })
})

describe('mutual exclusion between gaze and hot modes', () => {
  it('entering hot mode while in gaze clears gaze', () => {
    setGazeModeActive(true)
    toggleHotMode()
    expect(isGazeModeActive()).toBe(false)
    expect(isHotMode()).toBe(true)
  })

  it('entering gaze mode while in hot clears hot', () => {
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    setGazeModeActive(true)
    expect(isGazeModeActive()).toBe(true)
    expect(isHotMode()).toBe(false)
  })

  it('cannot have both modes active at once', () => {
    // Start with hot
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    expect(isGazeModeActive()).toBe(false)
    // Switch to gaze via setter
    setGazeModeActive(true)
    expect(isHotMode()).toBe(false)
    expect(isGazeModeActive()).toBe(true)
    // Switch back to hot
    toggleHotMode()
    expect(isHotMode()).toBe(true)
    expect(isGazeModeActive()).toBe(false)
  })
})

describe('subscribeGamepad pub/sub', () => {
  it('fires listener on input source change', () => {
    const cb = jest.fn()
    subscribeGamepad(cb)
    markGamepadInput()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire listener on idempotent input source set', () => {
    markGamepadInput()
    const cb = jest.fn()
    subscribeGamepad(cb)
    markGamepadInput() // already active
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires listener when entering gaze mode interrupts hot mode', () => {
    toggleHotMode()
    const cb = jest.fn()
    subscribeGamepad(cb)
    setGazeModeActive(true)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire listener when entering gaze mode without hot interruption', () => {
    const cb = jest.fn()
    subscribeGamepad(cb)
    setGazeModeActive(true)
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires listener on every toggleHotMode call', () => {
    const cb = jest.fn()
    subscribeGamepad(cb)
    toggleHotMode()
    expect(cb).toHaveBeenCalledTimes(1)
    toggleHotMode()
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('unsubscribe stops further notifications', () => {
    const cb = jest.fn()
    const unsubscribe = subscribeGamepad(cb)
    markGamepadInput()
    expect(cb).toHaveBeenCalledTimes(1)
    unsubscribe()
    markKeyboardInput()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('getActionHint', () => {
  describe('keyboard mode (gamepad inactive)', () => {
    it('returns the keyboard glyph for axiom', () => {
      expect(getActionHint('axiom')).toBe('⎵') // Space
    })

    it('returns the keyboard glyph for undo', () => {
      expect(getActionHint('undo')).toBe('⌫') // Backspace
    })

    it('returns the keyboard glyph for leftWeakening', () => {
      expect(getActionHint('leftWeakening')).toBe('s')
    })

    it('returns the keyboard glyph for gazeLeft', () => {
      expect(getActionHint('gazeLeft')).toBe('←')
    })
  })

  describe('gamepad active in gaze mode', () => {
    beforeEach(() => {
      markGamepadInput()
    })

    it('returns Cross for axiom (lowest-index binding wins)', () => {
      expect(getActionHint('axiom')).toBe('✕')
    })

    it('returns Circle for undo', () => {
      expect(getActionHint('undo')).toBe('◯')
    })

    it('returns D-pad arrows for gaze actions', () => {
      expect(getActionHint('gazeLeft')).toBe('←')
      expect(getActionHint('gazeRight')).toBe('→')
      expect(getActionHint('gazeConnective')).toBe('↑')
      expect(getActionHint('gazeWeakening')).toBe('↓')
    })

    it('returns nothing for rule actions (no pad mapping in gaze mode)', () => {
      expect(getActionHint('leftWeakening')).toBeUndefined()
      expect(getActionHint('rightConnective')).toBeUndefined()
      expect(getActionHint('leftRotateLeft')).toBeUndefined()
    })

    it('returns L1/R1 for branch nav', () => {
      expect(getActionHint('prevBranch')).toBe('L1')
      expect(getActionHint('nextBranch')).toBe('R1')
    })

    it('returns Options for menu', () => {
      expect(getActionHint('menu')).toBe('☰')
    })
  })

  describe('gamepad active in hot mode', () => {
    beforeEach(() => {
      markGamepadInput()
      toggleHotMode()
    })

    it('returns R2 for axiom (Cross is now rightWeakening)', () => {
      expect(getActionHint('axiom')).toBe('R2')
    })

    it('returns L2 for undo (Circle is now rightRotateRight)', () => {
      expect(getActionHint('undo')).toBe('L2')
    })

    it('returns D-pad arrows for left rules', () => {
      expect(getActionHint('leftRotateLeft')).toBe('←')
      expect(getActionHint('leftConnective')).toBe('↑')
      expect(getActionHint('leftWeakening')).toBe('↓')
      expect(getActionHint('leftRotateRight')).toBe('→')
    })

    it('returns face button glyphs for right rules', () => {
      expect(getActionHint('rightRotateLeft')).toBe('□')
      expect(getActionHint('rightConnective')).toBe('△')
      expect(getActionHint('rightWeakening')).toBe('✕')
      expect(getActionHint('rightRotateRight')).toBe('◯')
    })

    it('returns nothing for gaze actions (no pad mapping in hot mode)', () => {
      expect(getActionHint('gazeLeft')).toBeUndefined()
      expect(getActionHint('gazeRight')).toBeUndefined()
      expect(getActionHint('gazeConnective')).toBeUndefined()
      expect(getActionHint('gazeWeakening')).toBeUndefined()
    })

    it('still returns L1/R1 for branch nav', () => {
      expect(getActionHint('prevBranch')).toBe('L1')
      expect(getActionHint('nextBranch')).toBe('R1')
    })
  })
})

describe('kbdHint', () => {
  it('returns the literal string in keyboard mode', () => {
    expect(kbdHint('n')).toBe('n')
  })

  it('returns undefined in pad mode', () => {
    markGamepadInput()
    expect(kbdHint('n')).toBeUndefined()
  })

  it('flips back when input source returns to keyboard', () => {
    markGamepadInput()
    expect(kbdHint('n')).toBeUndefined()
    markKeyboardInput()
    expect(kbdHint('n')).toBe('n')
  })
})

describe('dualHint', () => {
  it('returns the keyboard literal in keyboard mode', () => {
    expect(dualHint('n', 'axiom')).toBe('n')
  })

  it('returns the pad action glyph in pad mode (gaze)', () => {
    markGamepadInput()
    expect(dualHint('n', 'axiom')).toBe('✕')
  })

  it('returns the pad action glyph in pad mode (hot)', () => {
    markGamepadInput()
    toggleHotMode()
    expect(dualHint('n', 'axiom')).toBe('R2')
  })

  it('returns undefined when the pad action has no binding in the active map', () => {
    markGamepadInput()
    // gaze mode: leftWeakening has no pad binding
    expect(dualHint('s', 'leftWeakening')).toBeUndefined()
  })
})

describe('key map invariants', () => {
  it('every shared binding appears in both gaze and hot maps', () => {
    const sharedIndices = [4, 5, 6, 7, 9] // L1, R1, L2, R2, Options
    for (const idx of sharedIndices) {
      expect(ps5GazeKeyMap[idx]).toBeDefined()
      expect(ps5HotKeyMap[idx]).toBeDefined()
      expect(ps5GazeKeyMap[idx]).toBe(ps5HotKeyMap[idx])
    }
  })

  it('gaze map has all 4 D-pad directions bound to gaze actions', () => {
    expect(ps5GazeKeyMap[12]).toBe('gazeConnective')
    expect(ps5GazeKeyMap[13]).toBe('gazeWeakening')
    expect(ps5GazeKeyMap[14]).toBe('gazeLeft')
    expect(ps5GazeKeyMap[15]).toBe('gazeRight')
  })

  it('hot map has all 4 D-pad directions bound to left rule actions', () => {
    expect(ps5HotKeyMap[12]).toBe('leftConnective')
    expect(ps5HotKeyMap[13]).toBe('leftWeakening')
    expect(ps5HotKeyMap[14]).toBe('leftRotateLeft')
    expect(ps5HotKeyMap[15]).toBe('leftRotateRight')
  })

  it('hot map has all 4 face buttons bound to right rule actions', () => {
    expect(ps5HotKeyMap[0]).toBe('rightWeakening')
    expect(ps5HotKeyMap[1]).toBe('rightRotateRight')
    expect(ps5HotKeyMap[2]).toBe('rightRotateLeft')
    expect(ps5HotKeyMap[3]).toBe('rightConnective')
  })

  it('up/down convention is consistent across D-pad and face buttons in hot mode', () => {
    // Up = connective, down = weakening on both hands.
    expect(ps5HotKeyMap[12]).toBe('leftConnective') // D-pad up
    expect(ps5HotKeyMap[3]).toBe('rightConnective') // Triangle (top)
    expect(ps5HotKeyMap[13]).toBe('leftWeakening') // D-pad down
    expect(ps5HotKeyMap[0]).toBe('rightWeakening') // Cross (bottom)
  })

  it('no pad index is bound to two different actions within a single map', () => {
    const seenGaze = new Map<number, string>()
    for (const [idxStr, action] of Object.entries(ps5GazeKeyMap)) {
      const idx = Number(idxStr)
      expect(seenGaze.has(idx)).toBe(false)
      seenGaze.set(idx, action)
    }
    const seenHot = new Map<number, string>()
    for (const [idxStr, action] of Object.entries(ps5HotKeyMap)) {
      const idx = Number(idxStr)
      expect(seenHot.has(idx)).toBe(false)
      seenHot.set(idx, action)
    }
  })
})

describe('qwertyKeyMap basic shape', () => {
  it('binds Space and Enter to axiom', () => {
    expect(qwertyKeyMap['Space']).toBe('axiom')
    expect(qwertyKeyMap['Enter']).toBe('axiom')
  })

  it('binds Backspace to undo', () => {
    expect(qwertyKeyMap['Backspace']).toBe('undo')
  })

  it('binds the ASFG row to left rules', () => {
    expect(qwertyKeyMap['KeyA']).toBe('leftRotateLeft')
    expect(qwertyKeyMap['KeyS']).toBe('leftWeakening')
    expect(qwertyKeyMap['KeyF']).toBe('leftConnective')
    expect(qwertyKeyMap['KeyG']).toBe('leftRotateRight')
  })

  it('binds the HJL; row to right rules', () => {
    expect(qwertyKeyMap['KeyH']).toBe('rightRotateLeft')
    expect(qwertyKeyMap['KeyJ']).toBe('rightConnective')
    expect(qwertyKeyMap['KeyL']).toBe('rightWeakening')
    expect(qwertyKeyMap['Semicolon']).toBe('rightRotateRight')
  })

  it('binds arrow keys to gaze actions', () => {
    expect(qwertyKeyMap['ArrowLeft']).toBe('gazeLeft')
    expect(qwertyKeyMap['ArrowRight']).toBe('gazeRight')
    expect(qwertyKeyMap['ArrowUp']).toBe('gazeConnective')
    expect(qwertyKeyMap['ArrowDown']).toBe('gazeWeakening')
  })
})
