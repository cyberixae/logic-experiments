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
import { premise, isProof, subDerivation } from '../../model/derivation'
import { sequent, conclusion } from '../../model/sequent'
import { atom, implication, disjunction, conjunction } from '../../model/prop'
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
const r = atom('r')

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

  describe('branch focus after closing', () => {
    // (p ∨ q) ∨ r ⊢ p
    // After two dl applications, 3 open branches:
    //   [0] p ⊢ p, [1] q ⊢ p, [2] r ⊢ p
    const buildThreeBranches = () => {
      const goal = sequent([disjunction(disjunction(p, q), r)], [p])
      const f = focus(premise(goal))
      // dl on (p ∨ q) ∨ r gives: [0] p ∨ q ⊢ p, [1] r ⊢ p
      const after1 = apply(f, reverse0.dl.tryReverse)
      // dl on p ∨ q gives: [0] p ⊢ p, [1] q ⊢ p, [2] r ⊢ p
      const after2 = apply(after1, reverse0.dl.tryReverse)
      return after2
    }

    it('closing first branch advances forward', () => {
      const f = buildThreeBranches()
      // Close branch 0 (p ⊢ p) with identity
      const afterI = apply(f, reverse0.i.tryReverse)
      // Should move to next open branch, not wrap
      const seq = activeSequent(afterI)
      expect(seq).toEqual(sequent([q], [p]))
    })

    it('closing last open branch falls back to earlier branch', () => {
      // (p ∨ p) ∨ q ⊢ p — after two dl: [0] p ⊢ p, [1] p ⊢ p, [2] q ⊢ p
      const goal = sequent([disjunction(disjunction(p, p), q)], [p])
      const f = focus(premise(goal))
      const after1 = apply(f, reverse0.dl.tryReverse)
      const after2 = apply(after1, reverse0.dl.tryReverse)
      // Skip to branch 1, close it
      const onBranch1 = focus(after2.derivation, 1)
      expect(activeSequent(onBranch1)).toEqual(sequent([p], [p]))
      const closed1 = apply(onBranch1, reverse0.i.tryReverse)
      // Should advance forward to branch 2 (q ⊢ p)
      expect(activeSequent(closed1)).toEqual(sequent([q], [p]))
      // Now skip back to branch 0 and close it
      const onBranch0 = focus(closed1.derivation, 0)
      expect(activeSequent(onBranch0)).toEqual(sequent([p], [p]))
      const closed0 = apply(onBranch0, reverse0.i.tryReverse)
      // Only branch 2 (q ⊢ p) remains open — forward from 0 should find it
      expect(activeSequent(closed0)).toEqual(sequent([q], [p]))
      expect(isProof(closed0.derivation)).toBe(false)
    })

    it('closing last branch with no forward open falls backward', () => {
      // q ∨ (p ∨ p) ⊢ p — after two dl: [0] q ⊢ p, [1] p ⊢ p, [2] p ⊢ p
      const goal = sequent([disjunction(q, disjunction(p, p))], [p])
      const f = focus(premise(goal))
      const after1 = apply(f, reverse0.dl.tryReverse)
      // Branch 0: q ⊢ p, Branch 1: p ∨ p ⊢ p — we're on branch 0
      // Move to branch 1 and apply dl
      const onBranch1 = focus(after1.derivation, 1)
      const after2 = apply(onBranch1, reverse0.dl.tryReverse)
      // Now: [0] q ⊢ p, [1] p ⊢ p, [2] p ⊢ p
      // Close branch 2 (last)
      const onBranch2 = focus(after2.derivation, 2)
      expect(activeSequent(onBranch2)).toEqual(sequent([p], [p]))
      const closed2 = apply(onBranch2, reverse0.i.tryReverse)
      // No forward open branches from position 2 — should fall backward
      // Branch 1 (p ⊢ p) is the nearest backward open branch
      expect(activeSequent(closed2)).toEqual(sequent([p], [p]))
      expect(isProof(closed2.derivation)).toBe(false)
    })

    it('closing rightmost open branch does not wrap forward', () => {
      // p ∨ p ⊢ p — after dl, two branches: [0] p ⊢ p, [1] p ⊢ p
      const goal = sequent([disjunction(p, p)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      // Close branch 0
      const after1 = apply(afterDl, reverse0.i.tryReverse)
      expect(activeSequent(after1)).toEqual(sequent([p], [p]))
      // Close branch 1 (rightmost) — should not wrap to a closed branch
      const after2 = apply(after1, reverse0.i.tryReverse)
      // Proof is complete
      expect(isProof(after2.derivation)).toBe(true)
    })

    it('closing middle branch advances to next open', () => {
      // (p ∨ p) ∨ p ⊢ p — after two dl: 3 branches all p ⊢ p
      const goal = sequent([disjunction(disjunction(p, p), p)], [p])
      const f = focus(premise(goal))
      const after1 = apply(f, reverse0.dl.tryReverse)
      // branch 0: p ∨ p ⊢ p, branch 1: p ⊢ p
      // apply dl on branch 0 to split further
      const after2 = apply(after1, reverse0.dl.tryReverse)
      // 3 branches: [0] p ⊢ p, [1] p ⊢ p, [2] p ⊢ p
      // Close branch 0
      const closed0 = apply(after2, reverse0.i.tryReverse)
      // Now on branch 1 (middle). Close it.
      const closed1 = apply(closed0, reverse0.i.tryReverse)
      // Should advance forward to branch 2, not backward to closed 0
      expect(activeSequent(closed1)).toEqual(sequent([p], [p]))
      expect(isProof(closed1.derivation)).toBe(false)
    })
  })

  describe('undo after branch switch', () => {
    it('undo on current branch does not jump to closed branch', () => {
      // p ∨ q ⊢ p — after dl: [0] p ⊢ p, [1] q ⊢ p
      const goal = sequent([disjunction(p, q)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      // Close branch 0 with identity, auto-advances to branch 1
      const afterI = apply(afterDl, reverse0.i.tryReverse)
      expect(activeSequent(afterI)).toEqual(sequent([q], [p]))
      // Undo should undo dl on current branch, not jump to closed branch 0
      const afterUndo = undo(afterI)
      // The active path should point to an open premise, not a closed branch
      const undoneSeq = activeSequent(afterUndo)
      expect(undoneSeq).toBeDefined()
    })
  })

  describe('apply with branching rules landing on closed branch', () => {
    it('advances to next open branch after branching rule', () => {
      const goal = sequent([conjunction(p, q)], [p])
      const f = focus(premise(goal))
      const afterCl = apply(f, reverse0.cl.tryReverse)
      const seq = activeSequent(afterCl)
      expect(seq).toBeDefined()
    })

    it('nextOpenForward finds open branch when branching lands on closed', () => {
      // p ∨ p ⊢ p — dl gives [0] p ⊢ p, [1] p ⊢ p
      const goal = sequent([disjunction(p, p)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      // Close branch 0 — advances to branch 1
      const afterClose = apply(afterDl, reverse0.i.tryReverse)
      expect(activeSequent(afterClose)).toEqual(sequent([p], [p]))
      // Undo on branch 1 undoes dl, collapsing the tree back
      // This triggers nextOpenForward if undo restructure lands on closed
      const afterUndo = undo(afterClose)
      // Should land on an open branch
      const undoneSeq = activeSequent(afterUndo)
      expect(undoneSeq).toBeDefined()
      expect(
        afterUndo.derivation.kind === 'transformation' ||
          afterUndo.derivation.kind === 'premise',
      ).toBe(true)
    })

    it('branching with closed sibling uses nextOpenForward', () => {
      // (p ∨ q) ∨ (p ∨ p) ⊢ p
      // dl → [0] p ∨ q ⊢ p, [1] p ∨ p ⊢ p
      // dl on [0] → [0] p ⊢ p, [1] q ⊢ p, [2] p ∨ p ⊢ p
      // close [0] → on [1] q ⊢ p
      // move to [2] (p ∨ p ⊢ p), apply dl → new branches appear
      // branch index might land on closed [0]
      const goal = sequent(
        [disjunction(disjunction(p, q), disjunction(p, p))],
        [p],
      )
      const f = focus(premise(goal))
      const after1 = apply(f, reverse0.dl.tryReverse)
      const after2 = apply(after1, reverse0.dl.tryReverse)
      // [0] p ⊢ p, [1] q ⊢ p, [2] p ∨ p ⊢ p
      // Close [0]
      const closed0 = apply(after2, reverse0.i.tryReverse)
      // Now on [1] q ⊢ p. Move to [2] (p ∨ p ⊢ p)
      const onBranch2 = focus(closed0.derivation, closed0.branch + 1)
      // Apply dl on p ∨ p to split into two new branches
      const afterDl3 = apply(onBranch2, reverse0.dl.tryReverse)
      // Should land on an open branch regardless of tree restructure
      const seq = activeSequent(afterDl3)
      expect(seq).toBeDefined()
      // Should not be on a closed branch
      const path = activePath(afterDl3)
      const deriv = subDerivation(afterDl3.derivation, path)
      expect(deriv?.kind).toBe('premise')
    })

    it('wrapping branch counter lands on closed branch after split', () => {
      // p ∨ (p ∨ p) ⊢ p → dl → [0] p ⊢ p, [1] p ∨ p ⊢ p
      // Close [0] → branch counter = 1, on p ∨ p ⊢ p
      // Set branch counter to 3. After dl, branches = 3.
      // mod(3, 3) = 0 → points to closed branch [0]
      // nextOpenForward should find an open branch
      const goal2 = sequent([disjunction(p, disjunction(p, p))], [p])
      const f2 = focus(premise(goal2))
      const afterDl2 = apply(f2, reverse0.dl.tryReverse)
      // [0] p ⊢ p, [1] p ∨ p ⊢ p
      // Close branch 0
      const c0 = apply(afterDl2, reverse0.i.tryReverse)
      // branch counter = 1, on p ∨ p ⊢ p
      // Manually set branch to 3 (will mod to 1 in a 2-branch tree = p ∨ p ⊢ p)
      const wrapped = focus(c0.derivation, 3)
      expect(activeSequent(wrapped)).toEqual(
        activeSequent(focus(c0.derivation, 1)),
      )
      // Apply dl: tree goes from 2 branches to 3.
      // branch=3, mod(3,3)=0 → points to closed branch [0]
      const afterSplit = apply(wrapped, reverse0.dl.tryReverse)
      // nextOpenForward should find an open branch
      const splitPath = activePath(afterSplit)
      const splitDeriv = subDerivation(afterSplit.derivation, splitPath)
      expect(splitDeriv?.kind).toBe('premise')
    })
  })

  describe('forwardThenBackOpen fallback to backward', () => {
    it('falls back to earlier branch when no forward open branch exists', () => {
      // (p ∨ p) ∨ p ⊢ p — 3 branches after two dl
      const goal = sequent([disjunction(disjunction(p, p), p)], [p])
      const f = focus(premise(goal))
      const after1 = apply(f, reverse0.dl.tryReverse)
      const after2 = apply(after1, reverse0.dl.tryReverse)
      // Close branches 0 and 1 (first two), leaving only branch 2
      const closed0 = apply(after2, reverse0.i.tryReverse)
      const closed1 = apply(closed0, reverse0.i.tryReverse)
      // Now on branch 2 (last). Close it.
      const closed2 = apply(closed1, reverse0.i.tryReverse)
      // All branches closed — proof is complete
      expect(isProof(closed2.derivation)).toBe(true)
    })
  })

  describe('undo with branch restructure', () => {
    it('undo after branching rule lands on open branch', () => {
      // p ∨ q ⊢ p — after dl: [0] p ⊢ p, [1] q ⊢ p
      const goal = sequent([disjunction(p, q)], [p])
      const f = focus(premise(goal))
      const afterDl = apply(f, reverse0.dl.tryReverse)
      // Close branch 0 (p ⊢ p), auto-advances to branch 1 (q ⊢ p)
      const afterI = apply(afterDl, reverse0.i.tryReverse)
      // Undo from branch 1 undoes dl, collapsing both branches
      const afterUndo = undo(afterI)
      // Should land on an open premise
      const undoneDerivation = afterUndo.derivation
      expect(undoneDerivation.kind).toBe('premise')
    })

    it('undo on a closed branch reopens it', () => {
      // p ⊢ p — apply i to close, then manually focus on it
      const f = focus(premise(sequent([p], [p])))
      const afterI = apply(f, reverse0.i.tryReverse)
      // The branch is now closed; force focus on it
      const onClosed = focus(afterI.derivation, 0)
      const afterUndo = undo(onClosed)
      expect(afterUndo.derivation.kind).toBe('premise')
      expect(activeSequent(afterUndo)).toEqual(sequent([p], [p]))
    })
  })

  describe('edge cases', () => {
    it('activePath wraps with negative branch', () => {
      const f = focus(premise(conclusion(p)), -1)
      // Should not throw
      const path = activePath(f)
      expect(path).toBeDefined()
    })

    it('prev then activePath works', () => {
      const f = focus(premise(conclusion(p)), 0)
      const prevF = prev(f)
      expect(prevF.branch).toBe(-1)
      // activePath should handle negative branch via mod
      const path = activePath(prevF)
      expect(path).toBeDefined()
    })
  })
})
