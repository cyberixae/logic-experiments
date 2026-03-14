import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch1weakening8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.a('q')],
    [lk.a('q'), lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.a('p')],
  ),
}
