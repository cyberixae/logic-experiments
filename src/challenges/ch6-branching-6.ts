import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch6branching6: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'nl',
    'nr',
    'cl',
    'cr',
    'dl',
    'dr',
    'ir',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
      lk.o.p2.disjunction(
        lk.o.p1.negation(lk.a('p')),
        lk.o.p1.negation(lk.a('q')),
      ),
    ),
  ),
}
