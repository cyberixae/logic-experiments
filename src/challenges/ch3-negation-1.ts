import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch3negation1: Configuration<AnySequent> = {
  rules: ['i', 'nl', 'nr'],
  goal: sequent([lk.a('r'), lk.o.p1.negation(lk.a('r'))], []),
}
