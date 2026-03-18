import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem3: Configuration<AnySequent> = {
  rules: ['i', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(lk.a('p'), lk.a('r')),
      lk.o.p2.implication(lk.a('p'), lk.a('r')),
    ),
  ),
}
