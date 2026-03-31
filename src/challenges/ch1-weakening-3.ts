import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch1weakening3: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent([lk.a('p'), lk.a('q')], [lk.a('q'), lk.a('p')]),
}
