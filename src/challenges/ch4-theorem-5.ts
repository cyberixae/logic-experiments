import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch4theorem5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(lk.a('q'), lk.o.p2.implication(lk.a('r'), lk.a('q'))),
  ),
}
