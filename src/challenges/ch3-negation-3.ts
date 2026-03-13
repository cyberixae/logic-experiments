import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch3negation3: Configuration<AnyJudgement> = {
  rules: ['i','nl','nr'],
  goal: judgement([lk.o.p1.negation(lk.o.p1.negation(lk.a('q')))], [lk.a('q')]),
}
