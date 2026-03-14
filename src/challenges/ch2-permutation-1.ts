import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation1: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF'],
  goal: sequent(
    [lk.a('p'), lk.a('p'), lk.a('p'), lk.a('q'), lk.a('p'), lk.a('p')],
    [lk.a('q')],
  ),
}
