import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation6: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('q'), lk.a('s'))],
    [lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('s'), lk.a('q')), lk.o.p2.conjunction(lk.a('s'), lk.a('q'))],
  ),
}
