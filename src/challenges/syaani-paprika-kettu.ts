import { rev0, lk, } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const syaaniPaprikaKettu: Configuration<AnySequent> = {
  rules: Object.keys(rev0),
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(
        lk.o.p2.implication(lk.a('p'), lk.a('q')),

        lk.o.p2.disjunction(lk.o.p1.negation(lk.a('q')), lk.a('r')),
      ),
      lk.o.p2.disjunction(lk.o.p1.negation(lk.a('p')), lk.a('r')),
    ),
  ),
}
