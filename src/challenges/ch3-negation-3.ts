import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation3: Configuration<AnySequent> = {
  rules: ['i', 'nl', 'nr'],
  goal: sequent([lk.o.p1.negation(lk.o.p1.negation(lk.a('q')))], [lk.a('q')]),
}
