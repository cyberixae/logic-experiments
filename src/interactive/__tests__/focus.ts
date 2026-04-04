import {
  focus,
  next,
  prev,
  activePath,
  activeSequent,
  apply,
  undo,
  reset,
  applyEvent,
  applicableRules,
} from '../focus'
import { premise, isProof } from '../../model/derivation'
import { sequent, conclusion } from '../../model/sequent'
import { atom, implication, disjunction } from '../../model/prop'
import {
  reverse0 as ev0,
  reverse1 as ev1,
  undo as evUndo,
  reset as evReset,
  nextBranch as evNext,
  prevBranch as evPrev,
} from '../event'
import { reverse0 } from '../../rules'

const p = atom('p')
const q = atom('q')

describe('focus', () => {
  describe('focus constructor', () => {
    it('defaults to branch 0', () => {
      const f = focus(premise(conclusion(p)))
      expect(f.branch).toBe(0)
    })

    it('accepts explicit branch', () => {
      const f = focus(premise(conclusion(p)), 2)
      expect(f.branch).toBe(2)
    })
  })

  describe('next and prev', () => {
    it('next increments branch', () => {
      const f = focus(premise(conclusion(p)), 1)
      expect(next(f).branch).toBe(2)
    })

    it('prev decrements branch', () => {
      const f = focus(premise(conclusion(p)), 2)
      expect(prev(f).branch).toBe(1)
    })
  })

  describe('activePath', () => {
    it('returns empty path for a single premise', () => {
      const f = focus(premise(conclusion(p)))
      expect(activePath(f)).toEqual([])
    })

    it('returns path to first open branch after applying a 2-dep rule', () => {
      const goal = sequent([disjunction(p, q)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      expect(activePath(afterDl)).toEqual([0])
    })
  })

  describe('activeSequent', () => {
    it('returns the premise sequent when no rule applied', () => {
      const goal = conclusion(implication(p, q))
      const f = focus(premise(goal))
      expect(activeSequent(f)).toEqual(goal)
    })

    it('returns the subgoal sequent after applying ir', () => {
      const f = focus(premise(conclusion(implication(p, q))))
      const afterIr = apply(f, reverse0.ir.tryReverse)
      expect(activeSequent(afterIr)).toEqual(sequent([p], [q]))
    })
  })

  describe('apply', () => {
    it('applies a rule and returns updated focus', () => {
      const f = focus(premise(conclusion(implication(p, q))))
      const result = apply(f, reverse0.ir.tryReverse)
      expect(result.derivation.kind).toBe('transformation')
      expect(activeSequent(result)).toEqual(sequent([p], [q]))
    })

    it('returns unchanged focus when rule does not apply', () => {
      const f = focus(premise(conclusion(p)))
      // ir does not apply to a sequent without an implication on the right
      const result = apply(f, reverse0.ir.tryReverse)
      expect(result).toBe(f)
    })

    it('advances branch when open branches decrease', () => {
      const goal = sequent([disjunction(p, q)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      // Two open branches: [0] = p ⊢ p, [1] = q ⊢ p
      // Apply i to close the first branch (p ⊢ p)
      const afterI = apply(afterDl, reverse0.i.tryReverse)
      expect(afterI.branch).toBe(1)
    })

    it('reaching a complete proof via apply', () => {
      const f = focus(premise(sequent([p], [p])))
      const result = apply(f, reverse0.i.tryReverse)
      expect(isProof(result.derivation)).toBe(true)
    })

    it('chains ir then i to prove p → p', () => {
      const f = focus(premise(conclusion(implication(p, p))))
      const afterIr = apply(f, reverse0.ir.tryReverse)
      const afterI = apply(afterIr, reverse0.i.tryReverse)
      expect(isProof(afterI.derivation)).toBe(true)
    })
  })

  describe('undo', () => {
    it('undoes the last applied rule', () => {
      const goal = conclusion(implication(p, q))
      const f = focus(premise(goal))
      const afterIr = apply(f, reverse0.ir.tryReverse)
      const undone = undo(afterIr)
      expect(undone.derivation.kind).toBe('premise')
      expect(activeSequent(undone)).toEqual(goal)
    })

    it('is a no-op on a plain premise', () => {
      const f = focus(premise(conclusion(p)))
      const result = undo(f)
      expect(result).toBe(f)
    })

    it('undoes an axiom to restore open subgoal', () => {
      // After ir then i: ir(i()), branch advanced to 1
      // Undo should restore ir(premise(p ⊢ p)), not reset to premise(goal)
      const goal = conclusion(implication(p, p))
      const f = focus(premise(goal))
      const afterIr = apply(f, reverse0.ir.tryReverse)
      const afterI = apply(afterIr, reverse0.i.tryReverse)
      const undone = undo(afterI)
      expect(undone.derivation.kind).toBe('transformation')
      expect(activeSequent(undone)).toEqual(sequent([p], [p]))
    })
  })

  describe('reset', () => {
    it('resets to the original premise', () => {
      const goal = conclusion(implication(p, q))
      const f = focus(premise(goal))
      const afterIr = apply(f, reverse0.ir.tryReverse)
      const r = reset(afterIr)
      expect(r.branch).toBe(0)
      expect(r.derivation.kind).toBe('premise')
      expect(activeSequent(r)).toEqual(goal)
    })
  })

  describe('applicableRules', () => {
    it('returns applicable rules for a sequent', () => {
      const f = focus(premise(sequent([p], [p])))
      const rules = applicableRules(f)
      expect(rules).toContain('i')
    })

    it('includes i for an identity sequent', () => {
      const f = focus(premise(sequent([p], [p])))
      const rules = applicableRules(f)
      expect(rules).toContain('i')
      expect(rules).toContain('scl')
    })
  })

  describe('applyEvent', () => {
    it('reverse0 event applies a rule', () => {
      const f = focus(premise(conclusion(implication(p, q))))
      const result = applyEvent(f, ev0('ir'))
      expect(activeSequent(result)).toEqual(sequent([p], [q]))
    })

    it('reverse1 event applies a rule with a formula', () => {
      const goal = conclusion(p)
      const f = focus(premise(goal))
      // cut with formula p: creates ⊢ p and p ⊢ on right
      const result = applyEvent(f, ev1('cut', p))
      expect(result.derivation.kind).toBe('transformation')
    })

    it('undo event undoes last rule', () => {
      const goal = conclusion(implication(p, q))
      const f = focus(premise(goal))
      const afterIr = applyEvent(f, ev0('ir'))
      const afterUndo = applyEvent(afterIr, evUndo())
      expect(activeSequent(afterUndo)).toEqual(goal)
    })

    it('reset event resets to premise', () => {
      const goal = conclusion(implication(p, q))
      const f = focus(premise(goal))
      const afterIr = applyEvent(f, ev0('ir'))
      const afterReset = applyEvent(afterIr, evReset())
      expect(afterReset.derivation.kind).toBe('premise')
    })

    it('nextBranch event increments branch', () => {
      const f = focus(premise(conclusion(p)), 0)
      const result = applyEvent(f, evNext())
      expect(result.branch).toBe(1)
    })

    it('prevBranch event decrements branch', () => {
      const f = focus(premise(conclusion(p)), 2)
      const result = applyEvent(f, evPrev())
      expect(result.branch).toBe(1)
    })
  })
})
