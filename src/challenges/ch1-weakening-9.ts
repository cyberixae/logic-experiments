import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch1weakening9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('p'), lk.a('q'), lk.a('r'), lk.a('s')],
  ),
}
