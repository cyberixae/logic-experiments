import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'nl', 'nr'],
  goal: sequent(
    [
      lk.o.p1.negation(
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
      ),
    ],
    [
      lk.o.p1.negation(
        lk.o.p1.negation(
          lk.o.p1.negation(
            lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
          ),
        ),
      ),
    ],
  ),
}
