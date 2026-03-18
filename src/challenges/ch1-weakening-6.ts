import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening6: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.a('p'), lk.a('q'), lk.a('q'), lk.a('p')],
    [lk.a('p'), lk.a('q'), lk.a('q'), lk.a('p')],
  ),
}
