import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition9: Configuration<AnySequent> = {
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
    'dr',
    'ir',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(
        lk.o.p2.conjunction(
          lk.o.p1.negation(lk.a('p')),
          lk.o.p1.negation(lk.a('s')),
        ),
        lk.o.p2.conjunction(lk.o.p1.negation(lk.a('p')), lk.a('r')),
      ),
      lk.o.p2.disjunction(
        lk.o.p2.disjunction(lk.a('q'), lk.o.p1.negation(lk.a('q'))),
        lk.o.p2.disjunction(lk.a('s'), lk.o.p1.negation(lk.a('r'))),
      ),
    ),
  ),
}
