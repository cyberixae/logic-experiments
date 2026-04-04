import { lk } from '../../systems/lk'
import { sequent } from '../../model/sequent'
import { isTautology } from '../../model/sequent'
import { bruteLimit } from '../brute'

const { a } = lk
const p = a('p')
const q = a('q')

// ---------------------------------------------------------------------------
// isTautology checks
//
// brute0Premise prunes sub-goals where isTautology returns false.
// A sequent is a tautology iff (∧ antecedent) → (∨ succedent) holds for
// every valuation. All provable LK sequents are tautologies (soundness), so
// this pruning is always safe — it never prunes a provable sub-goal.
// ---------------------------------------------------------------------------

describe('isTautology on sequents', () => {
  it('returns true for identity', () => {
    expect(isTautology(sequent([p], [p]))).toBe(true)
  })

  it('returns true for weakened identity', () => {
    // (p ∧ q) → p is a tautology
    expect(isTautology(sequent([p, q], [p]))).toBe(true)
  })

  it('returns false for non-theorem', () => {
    // p → q is not a tautology
    expect(isTautology(sequent([p], [q]))).toBe(false)
  })

  it('returns false for empty sequent', () => {
    // ⊥ is not a tautology
    expect(isTautology(sequent([], []))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Good pruning: brute terminates quickly because isTautology prunes dead ends
// ---------------------------------------------------------------------------

describe('brute with good pruning', () => {
  it('finds identity proof at limit 1', () => {
    // p ⊢ p is a tautology; brute finds it immediately
    const [proof] = bruteLimit({ goal: sequent([p], [p]), rules: ['i'] }, 5)
    expect(proof).toBeDefined()
  })

  it('finds weakened identity at limit 1', () => {
    // p, q ⊢ p: farLeft=p matches farRight=p after hypoWeaken; bruteWeaken0 adds q back
    const [proof] = bruteLimit(
      { goal: sequent([p, q], [p]), rules: ['i', 'swl'] },
      5,
    )
    expect(proof).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// bruteRotate0 gap: brute cannot reconnect proofs found via hypoRotate when
// the required structural rule is absent from bruteRotate0.
//
// brute0Premise uses hypoRotate (all cyclic rotations) to bring any formula
// to the farLeft/farRight boundary so hypoWeaken+axiom can fire. But the
// proof found for the rotated sequent is reconnected to the original only
// via bruteRotate0, which handles sRotLF and sRotRF only.
//
// Consequence: if a proof exists only for a rotation that differs from the
// original AND the rule set lacks sRotLF/sRotRF, bruteRotate0 cannot
// reconnect and brute returns empty at every limit.
// ---------------------------------------------------------------------------

describe('bruteRotate0 gap', () => {
  it('finds proof when axiom formula is already at farLeft (no rotation needed)', () => {
    // p is first antecedent — hypoWeaken picks it up as farLeft immediately
    const [proof] = bruteLimit(
      { goal: sequent([p, q], [p]), rules: ['i', 'swl'] },
      5,
    )
    expect(proof).toBeDefined()
  })

  it('cannot find proof when axiom formula needs rotation that bruteRotate0 lacks', () => {
    // q, p ⊢ p: proof requires putting p at farLeft via sRotLF or sxl,
    // then weakening q away. Without those rules, bruteRotate0 cannot
    // reconnect the rotated proof back to the original sequent.
    const [proof] = bruteLimit(
      { goal: sequent([q, p], [p]), rules: ['i', 'swl'] },
      10,
    )
    expect(proof).toBeUndefined()
  })

  it('finds proof when sRotLF is available to reconnect', () => {
    // With sRotLF, bruteRotate0 can reconnect after rotation
    const [proof] = bruteLimit(
      { goal: sequent([q, p], [p]), rules: ['i', 'swl', 'sRotLF'] },
      10,
    )
    expect(proof).toBeDefined()
  })
})
