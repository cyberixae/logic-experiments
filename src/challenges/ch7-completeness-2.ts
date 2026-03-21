import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch7completeness2: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'nl',
    'nr',
    'il',
    'ir',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(lk.a('p'), lk.a('q')),
      lk.o.p2.implication(
        lk.o.p1.negation(lk.a('q')),
        lk.o.p1.negation(lk.a('p')),
      ),
    ),
  ),
}
