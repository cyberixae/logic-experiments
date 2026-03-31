import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch2permutation7: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [
      lk.o.p2.implication(lk.a('q'), lk.a('p')),
      lk.o.p2.implication(lk.a('p'), lk.a('s')),
      lk.o.p2.implication(lk.a('s'), lk.a('r')),
    ],
    [
      lk.o.p2.implication(lk.a('r'), lk.a('p')),
      lk.o.p2.implication(lk.a('p'), lk.a('s')),
      lk.o.p2.implication(lk.a('s'), lk.a('q')),
    ],
  ),
}
