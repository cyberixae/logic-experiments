import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem6: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(lk.a('r'), lk.o.p2.implication(lk.a('q'), lk.a('q'))),
  ),
}
