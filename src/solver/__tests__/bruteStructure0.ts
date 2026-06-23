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
const iProof: ProofUsing<AnySequent, RuleId> = i.i(p)

describe('bruteStructure0', () => {
  const goal = (ant: Prop[], suc: Prop[]) => premise(sequent(ant, suc))

  describe('baseline: no structural work needed', () => {
    it('succeeds when goal matches core proof directly', () => {
      const [proof] = head(bruteStructure0(goal([p], [p]), ['i'], iProof))
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([p], [p]))).toBe(true)
    })
  })

  describe('antecedent weakening (swl)', () => {
    it('strips boundary formula when it is last', () => {
      // p, q ⊢ p: q is last, swl removes it directly
      const [proof] = head(
        bruteStructure0(goal([p, q], [p]), ['i', 'swl'], iProof),
      )
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([p, q], [p]))).toBe(true)
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
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([p], [q, p]))).toBe(true)
    })

    it('cannot strip non-boundary formula without rotation', () => {
      // p ⊢ p, q: swr would remove p (first) — no proof
      const [proof] = head(
        bruteStructure0(goal([p], [p, q]), ['i', 'swr'], iProof),
      )
      expect(proof).toBeUndefined()
    })
  })

  describe('antecedent backward rotation (sRotLB)', () => {
    it('rotates then weakens to reach core', () => {
      // q, p ⊢ p: sRotLB gives p, q ⊢ p, then swl removes q
      const [proof] = head(
        bruteStructure0(goal([q, p], [p]), ['i', 'sRotLB', 'swl'], iProof),
      )
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([q, p], [p]))).toBe(true)
    })

    it('chains multiple backward rotations', () => {
      // r, q, p ⊢ p
      const [proof] = head(
        bruteStructure0(goal([r, q, p], [p]), ['i', 'sRotLB', 'swl'], iProof),
      )
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([r, q, p], [p]))).toBe(true)
    })
  })

  describe('succedent backward rotation (sRotRB)', () => {
    it('rotates then weakens to reach core', () => {
      // p ⊢ p, q: swr would remove p (first); sRotRB gives dep p ⊢ q, p, then swr removes q
      const [proof] = head(
        bruteStructure0(goal([p], [p, q]), ['i', 'sRotRB', 'swr'], iProof),
      )
      if (!proof) throw new Error('no proof')
      expect(equals(proof.result, sequent([p], [p, q]))).toBe(true)
    })
  })
})
