import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch5composition5: Configuration<AnySequent> = {
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
        lk.o.p2.conjunction(lk.a('r'), lk.a('p')),
        lk.o.p2.disjunction(lk.a('p'), lk.a('r')),
      ),
    ],

    [
      lk.o.p2.disjunction(
        lk.o.p2.conjunction(lk.a('p'), lk.a('r')),
        lk.o.p2.disjunction(lk.a('r'), lk.a('p')),
      ),
    ],
  ),
}
