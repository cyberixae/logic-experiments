import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch0identity2: Conjecture<AnyJudgement> = {
  rules: ['i'],
  goal: judgement([lk.a('q')], [lk.a('q')]),
}
