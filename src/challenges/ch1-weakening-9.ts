import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('p'), lk.a('q'), lk.a('r'), lk.a('s')],
  ),
}
