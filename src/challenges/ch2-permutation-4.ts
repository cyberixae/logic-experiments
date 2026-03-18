import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation4: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
  ),
}
