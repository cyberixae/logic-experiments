import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const violettiLuumuBiisoni: Configuration<AnySequent> = {
  rules: Object.keys(rev) as Array<Rev>,
  goal: conclusion(lk.o.p2.implication(lk.a('p'), lk.a('p'))),
}
