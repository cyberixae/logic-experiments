import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch2permutation9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('p'), lk.o.p1.negation(lk.a('p')), lk.a('q'), lk.a('r')],
    [
      lk.o.p1.negation(lk.a('q')),
      lk.o.p1.negation(lk.a('p')),
      lk.a('s'),
      lk.o.p1.negation(lk.a('r')),
    ],
  ),
}
