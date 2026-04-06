import { rk } from '../../systems/rk'
import { premise, ProofUsing } from '../../model/derivation'
import { AnySequent, sequent, equals } from '../../model/sequent'
import { RuleId } from '../../model/rule'
import { Prop } from '../../model/prop'
import { head } from '../../utils/seq'
import { bruteStructure0 } from '../bruteStructure0'

const { a, i } = rk
const p = a('p')
const q = a('q')
const r = a('r')
const iProof = i.i(p) as ProofUsing<AnySequent, RuleId>

describe('bruteStructure0', () => {
  const goal = (ant: Prop[], suc: Prop[]) => premise(sequent(ant, suc))

  describe('baseline: no structural work needed', () => {
    it('succeeds when goal matches core proof directly', () => {
      const [proof] = head(bruteStructure0(goal([p], [p]), ['i'], iProof))
      expect(equals(proof!.result, sequent([p], [p]))).toBe(true)
    })
  })

  describe('antecedent weakening (swl)', () => {
    it('strips boundary formula when it is last', () => {
      // p, q ⊢ p: q is last, swl removes it directly
      const [proof] = head(
        bruteStructure0(goal([p, q], [p]), ['i', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([p, q], [p]))).toBe(true)
    })

    it('cannot strip non-boundary formula without rotation', () => {
      // q, p ⊢ p: swl would remove p (last), leaving q ⊢ p — no proof
      const [proof] = head(
        bruteStructure0(goal([q, p], [p]), ['i', 'swl'], iProof),
      )
      expect(proof).toBeUndefined()
    })
  })

  describe('succedent weakening (swr)', () => {
    it('strips boundary formula when it is first', () => {
      // p ⊢ q, p: q is first, swr removes it directly
      const [proof] = head(
        bruteStructure0(goal([p], [q, p]), ['i', 'swr'], iProof),
      )
      expect(equals(proof!.result, sequent([p], [q, p]))).toBe(true)
    })

    it('cannot strip non-boundary formula without rotation', () => {
      // p ⊢ p, q: swr would remove p (first) — no proof
      const [proof] = head(
        bruteStructure0(goal([p], [p, q]), ['i', 'swr'], iProof),
      )
      expect(proof).toBeUndefined()
    })
  })

  describe('antecedent forward rotation (sRotLF)', () => {
    it('rotates then weakens to reach core', () => {
      // q, p ⊢ p: sRotLF gives p, q ⊢ p, then swl removes q
      const [proof] = head(
        bruteStructure0(goal([q, p], [p]), ['i', 'sRotLF', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([q, p], [p]))).toBe(true)
    })

    it('chains multiple forward rotations', () => {
      // r, q, p ⊢ p: two sRotLF steps to reach p, r, q ⊢ p, then swl×2
      const [proof] = head(
        bruteStructure0(goal([r, q, p], [p]), ['i', 'sRotLF', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([r, q, p], [p]))).toBe(true)
    })
  })

  describe('antecedent backward rotation (sRotLB)', () => {
    it('rotates then weakens to reach core', () => {
      // q, p ⊢ p: sRotLB gives p, q ⊢ p, then swl removes q
      const [proof] = head(
        bruteStructure0(goal([q, p], [p]), ['i', 'sRotLB', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([q, p], [p]))).toBe(true)
    })

    it('chains multiple backward rotations', () => {
      // r, q, p ⊢ p
      const [proof] = head(
        bruteStructure0(goal([r, q, p], [p]), ['i', 'sRotLB', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([r, q, p], [p]))).toBe(true)
    })
  })

  describe('succedent forward rotation (sRotRF)', () => {
    it('rotates then weakens to reach core', () => {
      // p ⊢ p, q: swr would remove p (first); sRotRF gives dep p ⊢ q, p, then swr removes q
      const [proof] = head(
        bruteStructure0(goal([p], [p, q]), ['i', 'sRotRF', 'swr'], iProof),
      )
      expect(equals(proof!.result, sequent([p], [p, q]))).toBe(true)
    })
  })

  describe('succedent backward rotation (sRotRB)', () => {
    it('rotates then weakens to reach core', () => {
      // p ⊢ p, q: swr would remove p (first); sRotRB gives dep p ⊢ q, p, then swr removes q
      const [proof] = head(
        bruteStructure0(goal([p], [p, q]), ['i', 'sRotRB', 'swr'], iProof),
      )
      expect(equals(proof!.result, sequent([p], [p, q]))).toBe(true)
    })
  })

  describe('antecedent exchange (sxl)', () => {
    it('swaps last two then weakens to reach core', () => {
      // q, p, r ⊢ p: swl removes r → q, p; sxl swaps → p, q; swl removes q → p
      const [proof] = head(
        bruteStructure0(goal([q, p, r], [p]), ['i', 'sxl', 'swl'], iProof),
      )
      expect(equals(proof!.result, sequent([q, p, r], [p]))).toBe(true)
    })

    it('cannot reach core with swl alone when target is not at boundary', () => {
      // q, p, r ⊢ p: swl alone would remove p before q
      const [proof] = head(
        bruteStructure0(goal([q, p, r], [p]), ['i', 'swl'], iProof),
      )
      expect(proof).toBeUndefined()
    })
  })

  describe('succedent exchange (sxr)', () => {
    it('swaps first two then weakens to reach core', () => {
      // p ⊢ r, p, q: swr removes r → p ⊢ p, q; sxr swaps → p ⊢ q, p; swr removes q → p ⊢ p
      const [proof] = head(
        bruteStructure0(goal([p], [r, p, q]), ['i', 'sxr', 'swr'], iProof),
      )
      expect(equals(proof!.result, sequent([p], [r, p, q]))).toBe(true)
    })
  })
})
