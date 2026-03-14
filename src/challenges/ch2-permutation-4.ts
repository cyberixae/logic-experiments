import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation4: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
  ),
}
