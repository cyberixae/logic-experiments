import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch1weakening2: Conjecture<AnyJudgement> = {
  rules: ['i', 'swr'],
  goal: judgement([lk.a('p')], [lk.a('q'), lk.a('p')]),
}
