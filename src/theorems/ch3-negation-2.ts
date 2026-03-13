import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch3negation2: Conjecture<AnyJudgement> = {
  rules: ['i','nr'],
  goal: judgement([], [lk.o.p1.negation(lk.a('r')), lk.a('r')]),
}
