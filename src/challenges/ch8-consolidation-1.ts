import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch8consolidation1: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB', 'nl', 'nr', 'il', 'ir', 'cl', 'cr', 'dl', 'dr'],
  goal: conclusion(
    lk.o.p2.disjunction(
      lk.o.p2.disjunction(lk.a('r'), lk.a('s')),
      lk.o.p2.implication(
        lk.o.p2.conjunction(
          lk.o.p2.implication(lk.a('q'), lk.a('r')),
          lk.o.p2.conjunction(lk.a('p'), lk.a('q')),
        ),
        lk.o.p2.implication(lk.a('q'), lk.a('r')),
      ),
    ),
  ),
}
