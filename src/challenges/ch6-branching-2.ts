import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch6branching2: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'dl',
    'cr',
  ],
  goal: sequent(
    [lk.a('p'), lk.a('q')],
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
  ),
}
