import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch8constants4: Configuration<AnySequent> = {
  rules: ['f', 'v', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('r'), lk.o.p0.falsum, lk.a('s')],
    [lk.a('s'), lk.o.p0.falsum, lk.a('r')],
  ),
}
