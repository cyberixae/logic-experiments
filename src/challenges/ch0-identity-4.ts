import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch0identity4: Configuration<AnySequent> = {
  rules: ['i'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('q'), lk.a('r'))],
    [lk.o.p2.conjunction(lk.a('q'), lk.a('r'))],
  ),
}
