import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch7completeness3: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'il', 'ir'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(lk.a('p'), lk.a('q')),
      lk.o.p2.implication(
        lk.o.p2.implication(lk.a('q'), lk.a('r')),
        lk.o.p2.implication(lk.a('p'), lk.a('r')),
      ),
    ),
  ),
}
