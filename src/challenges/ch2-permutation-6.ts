import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch2permutation6: Configuration<AnyJudgement> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('q'), lk.a('s'))],
    [lk.o.p2.conjunction(lk.a('q'), lk.a('s')), lk.o.p2.conjunction(lk.a('s'), lk.a('q')), lk.o.p2.conjunction(lk.a('s'), lk.a('q'))],
  ),
}
