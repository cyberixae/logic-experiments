import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch8constants7: Configuration<AnySequent> = {
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
    [lk.o.p2.disjunction(lk.o.p0.falsum, lk.a('p'))],
    [lk.o.p2.conjunction(lk.o.p0.verum, lk.a('p'))],
  ),
}
