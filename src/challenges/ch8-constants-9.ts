import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch8constants9: Configuration<AnySequent> = {
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
  goal: sequent(
    [
      lk.o.p2.conjunction(
        lk.o.p2.conjunction(lk.a('r'), lk.a('q')),
        lk.o.p2.implication(lk.a('s'), lk.o.p1.negation(lk.o.p0.verum)),
      ),
    ],
    [
      lk.o.p2.disjunction(
        lk.o.p2.implication(
          lk.a('s'),
          lk.o.p2.implication(lk.a('q'), lk.a('r')),
        ),
        lk.o.p0.falsum,
      ),
    ],
  ),
}
