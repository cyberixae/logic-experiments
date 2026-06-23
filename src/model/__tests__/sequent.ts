import { rk } from '../../systems/rk'
import {
  sequent,
  isTautology,
  isConclusion,
  refineConclusion,
  rotations,
} from '../sequent'
import { isAtom, isNegation } from '../prop'

const { a, o } = rk
const p = a('p')
const q = a('q')
const r = a('r')

describe('isTautology on sequents', () => {
  describe('atomic cases', () => {
    it('returns true for identity p ⊢ p', () => {
      expect(isTautology(sequent([p], [p]))).toBe(true)
    })

    it('returns true for weakened identity p, q ⊢ p', () => {
      expect(isTautology(sequent([p, q], [p]))).toBe(true)
    })

    it('returns false for non-theorem p ⊢ q', () => {
      expect(isTautology(sequent([p], [q]))).toBe(false)
    })

    it('returns false for empty sequent', () => {
      expect(isTautology(sequent([], []))).toBe(false)
    })

    it('returns true for ex falso: ⊥ ⊢', () => {
      expect(isTautology(sequent([o.p0.falsum], []))).toBe(true)
    })

    it('returns true for verum: ⊢ ⊤', () => {
      expect(isTautology(sequent([], [o.p0.verum]))).toBe(true)
    })
  })

  describe('distributive laws', () => {
    // p∧q ∨ p∧r ⊢ p∧(q∨r)  — distribution of ∧ over ∨
    it('returns true for left distributivity: p∧q ∨ p∧r ⊢ p∧(q∨r)', () => {
      const ant = o.p2.disjunction(
        o.p2.conjunction(p, q),
        o.p2.conjunction(p, r),
      )
      const suc = o.p2.conjunction(p, o.p2.disjunction(q, r))
      expect(isTautology(sequent([ant], [suc]))).toBe(true)
    })

    // p∧(q∨r) ⊢ p∧q ∨ p∧r  — distribution of ∧ over ∨ (reverse)
    it('returns true for right distributivity: p∧(q∨r) ⊢ p∧q ∨ p∧r', () => {
      const ant = o.p2.conjunction(p, o.p2.disjunction(q, r))
      const suc = o.p2.disjunction(
        o.p2.conjunction(p, q),
        o.p2.conjunction(p, r),
      )
      expect(isTautology(sequent([ant], [suc]))).toBe(true)
    })

    // p∨(q∧r) ⊢ (p∨q)∧(p∨r)
    it('returns true for ∨ over ∧ distribution', () => {
      const ant = o.p2.disjunction(p, o.p2.conjunction(q, r))
      const suc = o.p2.conjunction(
        o.p2.disjunction(p, q),
        o.p2.disjunction(p, r),
      )
      expect(isTautology(sequent([ant], [suc]))).toBe(true)
    })
  })

  describe('implication and negation', () => {
    it('returns true for modus ponens: p, p→q ⊢ q', () => {
      expect(isTautology(sequent([p, o.p2.implication(p, q)], [q]))).toBe(true)
    })

    it('returns true for double negation: ¬¬p ⊢ p', () => {
      expect(isTautology(sequent([o.p1.negation(o.p1.negation(p))], [p]))).toBe(
        true,
      )
    })

    it('returns true for contrapositive: p→q ⊢ ¬q→¬p', () => {
      const imp = o.p2.implication(p, q)
      const contra = o.p2.implication(o.p1.negation(q), o.p1.negation(p))
      expect(isTautology(sequent([imp], [contra]))).toBe(true)
    })

    it('returns false for converse: p→q ⊢ q→p (not valid)', () => {
      const pq = o.p2.implication(p, q)
      const qp = o.p2.implication(q, p)
      expect(isTautology(sequent([pq], [qp]))).toBe(false)
    })
  })
})

describe('isConclusion', () => {
  it('returns true for empty antecedent with single succedent (⊢ p)', () => {
    expect(isConclusion(sequent([], [p]))).toBe(true)
  })

  it('returns false when antecedent is non-empty (p ⊢ p)', () => {
    expect(isConclusion(sequent([p], [p]))).toBe(false)
  })

  it('returns false when succedent has more than one formula (⊢ p, q)', () => {
    expect(isConclusion(sequent([], [p, q]))).toBe(false)
  })

  it('returns false for empty succedent (⊢)', () => {
    expect(isConclusion(sequent([], []))).toBe(false)
  })
})

describe('refineConclusion', () => {
  it('refines a conclusion whose formula matches the inner refinement', () => {
    expect(refineConclusion(isAtom)(sequent([], [p]))).toBe(true)
  })

  it('rejects a conclusion whose formula fails the inner refinement', () => {
    expect(refineConclusion(isNegation)(sequent([], [p]))).toBe(false)
  })

  it('accepts a conclusion whose formula matches a negation refinement', () => {
    const np = o.p1.negation(p)
    expect(refineConclusion(isNegation)(sequent([], [np]))).toBe(true)
  })

  it('rejects when the succedent is empty', () => {
    expect(refineConclusion(isAtom)(sequent([], []))).toBe(false)
  })
})

describe('rotations', () => {
  it('yields the single rotation for a one-by-one sequent', () => {
    const rots = [...rotations(sequent([p], [q]))()]
    expect(rots).toEqual([sequent([p], [q])])
  })

  it('produces the cross product of antecedent and succedent rotations', () => {
    const rots = [...rotations(sequent([p, q], [r]))()]
    expect(rots).toEqual([sequent([p, q], [r]), sequent([q, p], [r])])
  })

  it('rotates both sides independently', () => {
    const rots = [...rotations(sequent([p, q], [q, r]))()]
    expect(rots).toEqual([
      sequent([p, q], [q, r]),
      sequent([p, q], [r, q]),
      sequent([q, p], [q, r]),
      sequent([q, p], [r, q]),
    ])
  })
})
