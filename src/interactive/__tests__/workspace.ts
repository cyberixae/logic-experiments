import { Workspace } from '../workspace'
import { sequent, conclusion } from '../../model/sequent'
import { atom, implication } from '../../model/prop'
import { isProof } from '../../model/derivation'
import {
  reverse0 as ev0,
  undo as evUndo,
  reset as evReset,
  nextBranch as evNext,
} from '../event'

const p = atom('p')
const q = atom('q')

const challenges = {
  identity: {
    goal: sequent([p], [p]),
    rules: ['i'] as const,
  },
  implication: {
    goal: conclusion(implication(p, p)),
    rules: ['ir', 'i'] as const,
  },
}

const gazeChallenge = {
  twoSided: {
    goal: sequent([p, q], [p, q]),
    rules: ['i', 'swl', 'swr', 'sRotLB', 'sRotRB'] as const,
  },
}

describe('workspace', () => {
  it('throws when constructed with no challenges', () => {
    expect(() => new Workspace({})).toThrow()
  })

  it('selects the first conjecture on construction', () => {
    const ws = new Workspace(challenges)
    expect(ws.selected).toBe('identity')
  })

  it('currentConjecture returns a focus for the selected conjecture', () => {
    const ws = new Workspace(challenges)
    const focus = ws.currentConjecture()
    expect(focus.derivation.kind).toBe('premise')
    expect(focus.derivation.result).toEqual(challenges.identity.goal)
  })

  it('nextConjectureId returns the next key', () => {
    const ws = new Workspace(challenges)
    expect(ws.nextConjectureId()).toBe('implication')
  })

  it('nextConjectureId wraps to last when already at last', () => {
    const ws = new Workspace(challenges)
    ws.selectConjecture('implication')
    expect(ws.nextConjectureId()).toBe('implication')
  })

  it('previousConjectureId returns the previous key', () => {
    const ws = new Workspace(challenges)
    ws.selectConjecture('implication')
    expect(ws.previousConjectureId()).toBe('identity')
  })

  it('previousConjectureId wraps to first when already at first', () => {
    const ws = new Workspace(challenges)
    expect(ws.previousConjectureId()).toBe('identity')
  })

  it('selectConjecture switches the active conjecture', () => {
    const ws = new Workspace(challenges)
    ws.selectConjecture('implication')
    expect(ws.selected).toBe('implication')
    expect(ws.currentConjecture().derivation.result).toEqual(
      challenges.implication.goal,
    )
  })

  it('selectConjecture reuses existing focus on second visit', () => {
    const ws = new Workspace(challenges)
    ws.selectConjecture('implication')
    ws.applyEvent(ev0('ir'))
    ws.selectConjecture('identity')
    ws.selectConjecture('implication')
    // The ir step applied earlier should still be there
    expect(ws.currentConjecture().derivation.kind).toBe('transformation')
  })

  it('isConjectureId returns true for valid keys', () => {
    const ws = new Workspace(challenges)
    expect(ws.isConjectureId('identity')).toBe(true)
    expect(ws.isConjectureId('implication')).toBe(true)
  })

  it('isConjectureId returns false for unknown keys', () => {
    const ws = new Workspace(challenges)
    expect(ws.isConjectureId('unknown')).toBe(false)
    expect(ws.isConjectureId(42)).toBe(false)
  })

  it('listConjectures returns all entries', () => {
    const ws = new Workspace(challenges)
    const list = ws.listConjectures()
    expect(list.map(([k]) => k)).toEqual(['identity', 'implication'])
  })

  it('availableRules returns the rules for the current challenge', () => {
    const ws = new Workspace(challenges)
    expect(ws.availableRules()).toEqual(['i'])
  })

  it('applicableRules returns intersection of available and applicable', () => {
    const ws = new Workspace(challenges)
    // identity sequent p ⊢ p: i is both available and applicable
    expect(ws.applicableRules()).toContain('i')
  })

  it('applicableRules excludes unavailable rules', () => {
    const ws = new Workspace(challenges)
    // ir is not in the identity challenge's rules
    expect(ws.applicableRules()).not.toContain('ir')
  })

  it('applyEvent applies a rule to the current conjecture', () => {
    const ws = new Workspace(challenges)
    ws.selectConjecture('implication')
    ws.applyEvent(ev0('ir'))
    expect(ws.currentConjecture().derivation.kind).toBe('transformation')
  })

  it('isSolved returns false before proof is complete', () => {
    const ws = new Workspace(challenges)
    expect(ws.isSolved()).toBe(false)
  })

  it('isSolved returns true after solving', () => {
    const ws = new Workspace(challenges)
    ws.applyEvent(ev0('i'))
    expect(ws.isSolved()).toBe(true)
    expect(isProof(ws.currentConjecture().derivation)).toBe(true)
  })

  it('applyEvent undo reverts the last rule', () => {
    const ws = new Workspace(challenges)
    ws.applyEvent(ev0('i'))
    ws.applyEvent(evUndo())
    expect(ws.currentConjecture().derivation.kind).toBe('premise')
  })

  describe('gaze preservation', () => {
    it('gaze defaults to left side', () => {
      const ws = new Workspace(gazeChallenge)
      const gaze = ws.gaze()
      expect(gaze.side).toBe('left')
    })

    it('gaze stays on right side after applying rule on right', () => {
      const ws = new Workspace(gazeChallenge)
      // Move gaze to right side
      ws.moveGaze(1)
      ws.moveGaze(1)
      expect(ws.gaze().side).toBe('right')
      // Apply weakening on right — removes a formula from right
      ws.applyEvent(ev0('swr'))
      // Gaze should stay on right side
      expect(ws.gaze().side).toBe('right')
    })

    it('gaze stays on left side after applying rule on left', () => {
      const ws = new Workspace(gazeChallenge)
      expect(ws.gaze().side).toBe('left')
      // Apply weakening on left
      ws.applyEvent(ev0('swl'))
      expect(ws.gaze().side).toBe('left')
    })

    it('gaze index clamps when formula count decreases', () => {
      const ws = new Workspace(gazeChallenge)
      // Gaze starts at index 1 (last on left, active position)
      expect(ws.gaze()).toEqual({ side: 'left', index: 1 })
      // Weaken left removes a formula, only 1 left
      ws.applyEvent(ev0('swl'))
      expect(ws.gaze().index).toBe(0)
      expect(ws.gaze().side).toBe('left')
    })

    it('gaze resets on branch switch', () => {
      const ws = new Workspace(gazeChallenge)
      ws.moveGaze(1) // move to a different position
      ws.applyEvent(evNext())
      // After branch switch, gaze should reset to default
      const gaze = ws.gaze()
      expect(gaze.side).toBe('left')
    })

    it('gaze resets on reset', () => {
      const ws = new Workspace(gazeChallenge)
      ws.moveGaze(1)
      ws.applyEvent(evReset())
      const gaze = ws.gaze()
      expect(gaze.side).toBe('left')
    })

    it('gaze falls back to default when side becomes empty', () => {
      const rightOnly = {
        test: {
          goal: sequent([p], [p, q]),
          rules: ['i', 'swr', 'swl'] as const,
        },
      }
      const ws = new Workspace(rightOnly)
      // Move gaze to left side (default)
      expect(ws.gaze().side).toBe('left')
      // Remove the only left formula
      ws.applyEvent(ev0('swl'))
      // Left is now empty, gaze should fall back to right
      expect(ws.gaze().side).toBe('right')
    })
  })

  describe('moveGaze', () => {
    it('moves gaze from left to right', () => {
      const ws = new Workspace(gazeChallenge)
      // Default gaze is left side, index 1
      expect(ws.gaze()).toEqual({ side: 'left', index: 1 })
      // Move right through left formulas then to right side
      ws.moveGaze(1)
      expect(ws.gaze()).toEqual({ side: 'right', index: 0 })
    })

    it('moves gaze from right to left', () => {
      const ws = new Workspace(gazeChallenge)
      ws.moveGaze(1) // to right index 0
      ws.moveGaze(-1) // back to left
      expect(ws.gaze().side).toBe('left')
    })

    it('wraps gaze around', () => {
      const ws = new Workspace(gazeChallenge)
      // p, q ⊢ p, q — 4 total formulas, gaze starts at left index 1
      // Move right 4 times should wrap back
      ws.moveGaze(1)
      ws.moveGaze(1)
      ws.moveGaze(1)
      ws.moveGaze(1)
      expect(ws.gaze()).toEqual({ side: 'left', index: 1 })
    })

    it('resets gazeKind to connective on move', () => {
      const ws = new Workspace(gazeChallenge)
      ws.setGazeKind('weakening')
      expect(ws.gazeKind()).toBe('weakening')
      ws.moveGaze(1)
      expect(ws.gazeKind()).toBe('connective')
    })
  })

  describe('applyEventWithGaze', () => {
    it('sets gaze to specified position', () => {
      const ws = new Workspace(gazeChallenge)
      ws.applyEventWithGaze(ev0('sRotLB'), {
        side: 'right',
        index: 1,
      })
      expect(ws.gaze()).toEqual({ side: 'right', index: 1 })
    })
  })

  describe('gazeKind', () => {
    it('defaults to connective', () => {
      const ws = new Workspace(gazeChallenge)
      expect(ws.gazeKind()).toBe('connective')
    })

    it('can be set to weakening', () => {
      const ws = new Workspace(gazeChallenge)
      ws.setGazeKind('weakening')
      expect(ws.gazeKind()).toBe('weakening')
    })

    it('resets to connective after applyEvent', () => {
      const ws = new Workspace(gazeChallenge)
      ws.setGazeKind('weakening')
      ws.applyEvent(ev0('sRotLB'))
      expect(ws.gazeKind()).toBe('connective')
    })
  })

  describe('defaultGaze on right-only sequent', () => {
    it('defaults to right side when antecedent is empty', () => {
      const rightOnly = {
        test: {
          goal: sequent([], [p]),
          rules: ['swr'] as const,
        },
      }
      const ws = new Workspace(rightOnly)
      expect(ws.gaze()).toEqual({ side: 'right', index: 0 })
    })
  })
})
