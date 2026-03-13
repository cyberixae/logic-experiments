import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion, judgement } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const ch3negation9: Conjecture<AnyJudgement> = {
  rules: ['i','nl','nr', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: judgement(
    [ lk.o.p1.negation(lk.a('p')), lk.o.p1.negation(lk.a('s')),  lk.o.p1.negation(lk.a('p')),lk.a('r')],
    [lk.a('q'), lk.o.p1.negation(lk.a('q')), lk.a('s'), lk.o.p1.negation(lk.a('r'))],
  ),
}
