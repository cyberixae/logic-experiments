import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch6branching1: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'dl', 'cr'],
  goal: sequent(
    [lk.o.p2.disjunction(lk.a('p'), lk.a('q'))],
    [lk.a('p'), lk.a('q')],
  ),
}
