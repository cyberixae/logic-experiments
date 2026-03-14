import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [lk.a('p'), lk.o.p1.negation(lk.a('p')), lk.a('q'), lk.a('r')],
    [lk.o.p1.negation(lk.a('q')), lk.o.p1.negation(lk.a('p')), lk.a('s'), lk.o.p1.negation(lk.a('r'))],
  ),
}
