import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch7completeness3: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'il',
    'ir',
  ],
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
