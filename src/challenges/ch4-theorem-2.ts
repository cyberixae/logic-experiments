import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch4theorem2: Configuration<AnyJudgement> = {
  rules: ['i','ir', 'swl'],
  goal: conclusion(lk.o.p2.implication(lk.a('q'), lk.o.p2.implication(lk.a('r'), lk.a('q')))),
}
