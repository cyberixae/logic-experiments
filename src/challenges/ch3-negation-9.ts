import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation9: Configuration<AnySequent> = {
  rules: ['i','nl','nr', 'swl', 'sRotLB', 'sRotLF', 'swr', 'sRotRB', 'sRotRF'],
  goal: sequent(
    [ lk.o.p1.negation(lk.a('p')), lk.o.p1.negation(lk.a('s')),  lk.o.p1.negation(lk.a('p')),lk.a('r')],
    [lk.a('q'), lk.o.p1.negation(lk.a('q')), lk.a('s'), lk.o.p1.negation(lk.a('r'))],
  ),
}
