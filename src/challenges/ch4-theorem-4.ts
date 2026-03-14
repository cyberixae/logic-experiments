import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem4: Configuration<AnySequent> = {
  rules: ['i','ir'],
  goal: sequent([lk.a('r'), lk.o.p1.negation(lk.a('r'))], []),
}
