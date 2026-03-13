import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch2permutation7: Configuration<AnyJudgement> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.o.p2.implication(lk.a('p'), lk.a('s')), lk.o.p2.implication(lk.a('s'), lk.a('r'))],
    [lk.o.p2.implication(lk.a('r'), lk.a('p')), lk.o.p2.implication(lk.a('p'), lk.a('s')), lk.o.p2.implication(lk.a('s'), lk.a('q'))],
  ),
}
