import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch0identity6: Conjecture<AnyJudgement> = {
  rules: ['i'],
  goal: judgement(
    [lk.o.p2.implication(lk.a('p'), lk.a('q'))],
    [lk.o.p2.implication(lk.a('p'), lk.a('q'))],
  ),
}
