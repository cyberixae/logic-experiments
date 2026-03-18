import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity4: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
  ),
}
