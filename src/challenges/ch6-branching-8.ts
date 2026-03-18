import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch6branching8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'ir', 'cl', 'cr', 'dl', 'dr'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(lk.a('p'), lk.o.p2.disjunction(lk.a('q'), lk.a('r'))),
      lk.o.p2.disjunction(
        lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
        lk.o.p2.conjunction(lk.a('p'), lk.a('r')),
      ),
    ),
  ),
}
