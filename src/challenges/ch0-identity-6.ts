import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity6: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.implication(lk.a('p'), lk.a('q'))],
    [lk.o.p2.implication(lk.a('p'), lk.a('q'))],
  ),
}
