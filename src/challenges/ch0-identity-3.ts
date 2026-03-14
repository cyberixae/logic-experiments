import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity3: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent([lk.o.p1.negation(lk.a('p'))], [lk.o.p1.negation(lk.a('p'))]),
}
