import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition6: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'cl',
    'dr',
  ],
  goal: sequent(
    [
      lk.o.p2.conjunction(
        lk.o.p2.disjunction(lk.a('r'), lk.a('p')),
        lk.o.p2.disjunction(lk.a('p'), lk.a('s')),
      ),
    ],

    [
      lk.o.p2.disjunction(
        lk.o.p2.disjunction(lk.a('s'), lk.a('p')),
        lk.o.p2.disjunction(lk.a('r'), lk.a('p')),
      ),
    ],
  ),
}
