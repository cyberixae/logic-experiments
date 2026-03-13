import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch3negation1: Configuration<AnyJudgement> = {
  rules: ['i','nl'],
  goal: judgement([lk.a('r'), lk.o.p1.negation(lk.a('r'))], []),
}
