import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch0identity1: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent([lk.a('p')], [lk.a('p')]),
}
