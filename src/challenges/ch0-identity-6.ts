import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity6: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.implication(lk.a('r'), lk.a('p'))],
    [lk.o.p2.implication(lk.a('r'), lk.a('p'))],
  ),
}
