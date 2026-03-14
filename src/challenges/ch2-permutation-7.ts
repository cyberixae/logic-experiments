import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation7: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.o.p2.implication(lk.a('p'), lk.a('s')), lk.o.p2.implication(lk.a('s'), lk.a('r'))],
    [lk.o.p2.implication(lk.a('r'), lk.a('p')), lk.o.p2.implication(lk.a('p'), lk.a('s')), lk.o.p2.implication(lk.a('s'), lk.a('q'))],
  ),
}
