import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Configuration } from '../model/theorem'

export const ch2permutation8: Configuration<AnyJudgement> = {
  rules: ['i', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [lk.o.p2.conjunction(lk.a('s'), lk.a('q')), lk.a('r'), lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.o.p1.negation(lk.a('r'))],
    [lk.o.p1.negation(lk.a('p')), lk.o.p2.implication(lk.a('s'), lk.a('q')), lk.o.p1.negation(lk.a('r')), lk.o.p2.disjunction(lk.a('q'), lk.a('p'))],
  ),
}
