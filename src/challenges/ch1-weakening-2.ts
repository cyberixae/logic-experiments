import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening2: Configuration<AnySequent> = {
  rules: ['i', 'swr'],
  goal: sequent([lk.a('p')], [lk.a('q'), lk.a('p')]),
}
