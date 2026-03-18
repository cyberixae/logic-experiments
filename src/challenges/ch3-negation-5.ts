import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'nl', 'nr'],
  goal: sequent(
    [
      lk.o.p1.negation(lk.o.p1.negation(lk.a('p'))),
      lk.o.p1.negation(lk.o.p1.negation(lk.o.p1.negation(lk.a('p')))),
    ],
    [
      lk.o.p1.negation(lk.o.p1.negation(lk.a('p'))),
      lk.o.p1.negation(lk.o.p1.negation(lk.o.p1.negation(lk.a('p')))),
    ],
  ),
}
