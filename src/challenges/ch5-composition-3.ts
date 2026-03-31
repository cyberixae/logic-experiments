import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch5composition3: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'cl', 'dr'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('q'), lk.a('p'))],
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
  ),
}
