import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q')), lk.a('p')],
    [lk.a('q'), lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
  ),
}
