import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening1: Configuration<AnySequent> = {
  rules: ['i', 'swl'],
  goal: sequent([lk.a('p'), lk.a('q')], [lk.a('p')]),
}
