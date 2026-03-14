import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity1: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent([lk.a('p')], [lk.a('p')]),
}
