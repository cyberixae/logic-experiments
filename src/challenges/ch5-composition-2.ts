import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition2: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'dr'],
  goal: sequent(
    [lk.a('q'), lk.a('p')],
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
  ),
}
