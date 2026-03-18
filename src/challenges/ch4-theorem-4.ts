import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem4: Configuration<AnySequent> = {
  rules: ['i', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(lk.a('q'), lk.o.p2.implication(lk.a('r'), lk.a('q'))),
      lk.o.p2.implication(lk.a('q'), lk.o.p2.implication(lk.a('r'), lk.a('q'))),
    ),
  ),
}
