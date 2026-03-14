import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity5: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
  ),
}
