import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch0identity7: Configuration<AnyJudgement> = {
  rules: ['i'],
  goal: judgement(
    [lk.o.p2.conjunction(lk.a('p'), lk.o.p1.negation(lk.a('q')))],
    [lk.o.p2.conjunction(lk.a('p'), lk.o.p1.negation(lk.a('q')))],
  ),
}
