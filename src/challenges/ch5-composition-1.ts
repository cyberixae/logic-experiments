import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition1: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'cl', 'dr'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
    [lk.a('q'), lk.a('p')],
  ),
}
