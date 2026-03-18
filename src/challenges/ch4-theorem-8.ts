import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'nl', 'nr', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p1.negation(lk.o.p1.negation(lk.a('s'))),
      lk.o.p1.negation(
        lk.o.p1.negation(lk.o.p1.negation(lk.o.p1.negation(lk.a('s')))),
      ),
    ),
  ),
}
