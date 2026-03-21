import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch0identity5: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.disjunction(lk.a('r'), lk.a('s'))],
    [lk.o.p2.disjunction(lk.a('r'), lk.a('s'))],
  ),
}
