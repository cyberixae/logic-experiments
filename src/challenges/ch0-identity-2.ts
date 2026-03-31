import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch0identity2: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent([lk.a('q')], [lk.a('q')]),
}
