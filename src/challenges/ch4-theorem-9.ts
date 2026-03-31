import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch4theorem9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'nl', 'nr', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p1.negation(
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
      ),

      lk.o.p1.negation(
        lk.o.p1.negation(
          lk.o.p1.negation(
            lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
          ),
        ),
      ),
    ),
  ),
}
