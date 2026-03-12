import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch0identity9: Conjecture<AnyJudgement> = {
  rules: ['i'],
  goal: judgement(
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.o.p1.negation(lk.a('q'))),
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('r'), lk.a('s'))),
      ),
    ],
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.o.p1.negation(lk.a('q'))),
        lk.o.p1.negation(lk.o.p2.conjunction(lk.a('r'), lk.a('s'))),
      ),
    ],
  ),
}
