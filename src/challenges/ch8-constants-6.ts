import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch8constants6: Configuration<AnySequent> = {
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
    'il',
    'ir',
    'cl',
    'cr',
    'dl',
    'dr',
  ],
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p1.negation(lk.o.p1.negation(lk.o.p0.falsum)),
      lk.o.p1.negation(
        lk.o.p1.negation(lk.o.p1.negation(lk.o.p1.negation(lk.a('s')))),
      ),
    ),
  ),
}
