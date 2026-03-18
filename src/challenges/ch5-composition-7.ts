import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition7: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'cl', 'dr'],
  goal: sequent(
    [
      lk.o.p2.conjunction(
        lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
        lk.o.p2.implication(lk.a('r'), lk.a('q')),
      ),
    ],
    [
      lk.o.p2.disjunction(
        lk.o.p2.implication(lk.a('q'), lk.a('r')),
        lk.o.p2.disjunction(lk.a('p'), lk.a('q')),
      ),
    ],
  ),
}
