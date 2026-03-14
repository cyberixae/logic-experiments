import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q')), lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q')), lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
  ),
}
