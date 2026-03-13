import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch2permutation2: Configuration<AnyJudgement> = {
  rules: ['i', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [lk.a('q')],
    [lk.a('p'), lk.a('p'), lk.a('p'), lk.a('q'), lk.a('p'), lk.a('p')],
  ),
}
