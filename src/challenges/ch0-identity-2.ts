import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch0identity2: Configuration<AnyJudgement> = {
  rules: ['i'],
  goal: judgement([lk.a('q')], [lk.a('q')]),
}
