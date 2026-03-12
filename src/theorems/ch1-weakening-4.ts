import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch1weakening4: Conjecture<AnyJudgement> = {
  rules: ['i', 'swl', 'swr'],
  goal: judgement(
    [lk.a('q'), lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
    [lk.o.p2.conjunction(lk.a('q'), lk.a('p')), lk.a('q')],
  ),
}
