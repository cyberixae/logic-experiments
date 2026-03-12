import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch0identity3: Conjecture<AnyJudgement> = {
  rules: ['i'],
  goal: judgement([lk.o.p1.negation(lk.a('p'))], [lk.o.p1.negation(lk.a('p'))]),
}
