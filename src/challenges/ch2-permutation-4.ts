import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch2permutation4: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
  ),
}
