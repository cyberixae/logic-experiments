import { Workspace } from '../workspace'
import { sequent, conclusion } from '../../model/sequent'
import { atom, implication } from '../../model/prop'
import { isProof } from '../../model/derivation'
import { reverse0 as ev0, undo as evUndo } from '../event'

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
})
