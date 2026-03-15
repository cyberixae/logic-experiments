import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch5composition9: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'nl', 'nr', 'ir', 'cl', 'dr'],
  goal: conclusion(
    lk.o.p2.implication(
      lk.a('p'),
      lk.o.p2.implication(
        lk.o.p1.negation(lk.o.p2.disjunction(lk.a('p'), lk.a('q'))),
        lk.o.p2.implication(lk.a('q'), lk.a('r')),
      ),
    ),
  ),
}
