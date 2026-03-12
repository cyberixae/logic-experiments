import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch1weakening1: Conjecture<AnyJudgement> = {
  rules: ['i', 'swl'],
  goal: judgement([lk.a('p'), lk.a('q')], [lk.a('p')]),
}
