import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem1: Configuration<AnySequent> = {
  rules: ['i', 'ir'],
  goal: conclusion(lk.o.p2.implication(lk.a('q'), lk.a('q'))),
}
