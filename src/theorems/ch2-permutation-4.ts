import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch2permutation4: Conjecture<AnyJudgement> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
    [lk.a('s'), lk.a('r'), lk.a('q'), lk.a('p')],
  ),
}
