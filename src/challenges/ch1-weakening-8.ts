import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch1weakening8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr'],
  goal: sequent(
    [lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.a('q')],
    [lk.a('q'), lk.o.p2.implication(lk.a('q'), lk.a('p')), lk.a('p')],
  ),
}
