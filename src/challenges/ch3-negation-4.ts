import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation4: Configuration<AnySequent> = {
  rules: ['i','nl','nr'],
  goal: sequent([
     lk.o.p1.negation(lk.o.p1.negation(  lk.a('s')))
  ], [
     lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.a('s')))))
  ]),
}
