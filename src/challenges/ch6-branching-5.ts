import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch6branching5: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'cl', 'cr', 'dl', 'dr'],
  goal: sequent(
    [lk.o.p2.conjunction(lk.a('p'), lk.a('q'))],
    [lk.o.p2.conjunction(lk.a('q'), lk.a('p'))],
  ),
}
