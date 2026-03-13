import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch2permutation1: Configuration<AnyJudgement> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF'],
  goal: judgement(
    [lk.a('p'), lk.a('p'), lk.a('p'), lk.a('q'), lk.a('p'), lk.a('p')],
    [lk.a('q')],
  ),
}
