import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch4theorem1: Configuration<AnyJudgement> = {
  rules: ['i','ir'],
  goal: conclusion(lk.o.p2.implication(lk.a('q'), lk.a('q'))),
}
