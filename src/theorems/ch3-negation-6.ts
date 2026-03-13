import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch3negation6: Conjecture<AnyJudgement> = {
  rules: ['i','nl','swl','nr','swr'],
  goal: judgement([
     lk.o.p1.negation(lk.o.p1.negation(  lk.a('p'))),
     lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.a('p'))))
  ], [
     lk.o.p1.negation(lk.o.p1.negation(  lk.a('p'))),
     lk.o.p1.negation( lk.o.p1.negation( lk.o.p1.negation( lk.a('p'))))
  ]),
}
