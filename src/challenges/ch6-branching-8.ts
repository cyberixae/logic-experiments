import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch6branching8: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'cl',
    'cr',
    'dl',
    'dr',
    'ir',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(lk.a('p'), lk.o.p2.disjunction(lk.a('q'), lk.a('r'))),
      lk.o.p2.disjunction(
        lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
        lk.o.p2.conjunction(lk.a('p'), lk.a('r')),
      ),
    ),
  ),
}
