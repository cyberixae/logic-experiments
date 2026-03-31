import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch4theorem2: Configuration<AnySequent> = {
  rules: ['i', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(lk.a('q'), lk.a('q')),
      lk.o.p2.conjunction(lk.a('q'), lk.a('q')),
    ),
  ),
}
