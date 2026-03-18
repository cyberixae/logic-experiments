import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const syaaniPaprikaKettu: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'ir', 'cl', 'dr'],
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
