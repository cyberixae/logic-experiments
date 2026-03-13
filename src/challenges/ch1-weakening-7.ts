import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch1weakening7: Configuration<AnyJudgement> = {
  rules: ['i', 'swl', 'swr'],
  goal: judgement(
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.a('q')),
        lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
      ),
    ],
    [
      lk.o.p2.implication(
        lk.o.p2.disjunction(lk.a('p'), lk.a('q')),
        lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
      ),
    ],
  ),
}
