import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch9consolidation3: Configuration<AnySequent> = {
  rules: [
    'i',
    'f',
    'v',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'nl',
    'nr',
    'cl',
    'cr',
    'dl',
    'dr',
    'il',
    'ir',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(
        lk.o.p2.implication(lk.a('p'), lk.a('q')),

        lk.o.p2.disjunction(lk.o.p1.negation(lk.a('q')), lk.a('r')),
      ),
      lk.o.p2.disjunction(lk.o.p1.negation(lk.a('p')), lk.a('r')),
    ),
  ),
  /*
  solution: lk.z.ir(
    lk.z.swl(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.z.ir(lk.i.i(lk.a('p'))),
    ),
  ),*/
}
