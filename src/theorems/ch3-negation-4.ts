import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch3negation4: Conjecture<AnyJudgement> = {
  rules: ['i','nl','nr'],
  goal: judgement([
     lk.o.p1.negation(lk.o.p1.negation(  lk.a('s')))
  ], [
     lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.a('s')))))
  ]),
}
