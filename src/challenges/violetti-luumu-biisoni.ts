import { rev0, lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const violettiLuumuBiisoni: Configuration<AnySequent> = {
  rules: Object.keys(rev0),
  goal: conclusion(lk.o.p2.implication(lk.a('p'), lk.a('p'))),
}
