import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch3negation7: Conjecture<AnyJudgement> = {
  rules: ['i','nl','nr'],
  goal: judgement([
    lk.o.p1.negation(
    lk.o.p1.negation(

    lk.o.p2.conjunction(lk.a('p'), lk.a('q'))
    ),
    ),
  
  ], [
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(

    lk.o.p2.conjunction(lk.a('p'), lk.a('q'))
    ),
    ),
    ),
    ),
  ]),
}
