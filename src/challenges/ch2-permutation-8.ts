import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch2permutation8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [
      lk.o.p2.conjunction(lk.a('s'), lk.a('q')),
      lk.a('r'),
      lk.o.p2.implication(lk.a('q'), lk.a('p')),
      lk.o.p1.negation(lk.a('r')),
    ],
    [
      lk.o.p1.negation(lk.a('p')),
      lk.o.p2.implication(lk.a('s'), lk.a('q')),
      lk.o.p1.negation(lk.a('r')),
      lk.o.p2.disjunction(lk.a('q'), lk.a('p')),
    ],
  ),
}
