import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem2: Configuration<AnySequent> = {
  rules: ['i', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(lk.a('q'), lk.a('q')),
      lk.o.p2.conjunction(lk.a('q'), lk.a('q')),
    ),
  ),
}
