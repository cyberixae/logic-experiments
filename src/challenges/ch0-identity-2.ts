import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity2: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent([lk.a('q')], [lk.a('q')]),
}
