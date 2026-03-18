import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch6branching7: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'nl',
    'nr',
    'ir',
    'cl',
    'cr',
    'dl',
    'dr',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.disjunction(
        lk.o.p1.negation(lk.a('p')),
        lk.o.p1.negation(lk.a('q')),
      ),
      lk.o.p1.negation(lk.o.p2.conjunction(lk.a('p'), lk.a('q'))),
    ),
  ),
}
