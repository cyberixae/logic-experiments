import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation3: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('p'), lk.a('p'), lk.a('p'), lk.a('q'), lk.a('p'), lk.a('p')],
    [lk.a('p'), lk.a('p'), lk.a('p'), lk.a('q'), lk.a('p'), lk.a('p')],
  ),
}
