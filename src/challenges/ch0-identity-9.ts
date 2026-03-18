import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity9: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.o.p1.negation(lk.a('q'))),
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('r'), lk.a('s'))),
      ),
    ],
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.o.p1.negation(lk.a('q'))),
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('r'), lk.a('s'))),
      ),
    ],
  ),
}
