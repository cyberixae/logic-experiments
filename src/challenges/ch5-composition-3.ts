import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition3: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'cl', 'dr'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('q'), lk.a('p'))],
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
  ),
}
