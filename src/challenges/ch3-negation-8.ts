import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch3negation8: Configuration<AnyJudgement> = {
  rules: ['i','nl','nr', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement([

    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    ),
    lk.o.p2.conjunction(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    ),
  
  ], [
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    ),
    ),

    lk.o.p2.conjunction(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
  
  ]),
}
