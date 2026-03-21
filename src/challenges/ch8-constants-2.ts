import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch8constants2: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('s'), lk.o.p0.falsum, lk.a('r')],
    [lk.a('q'), lk.o.p0.falsum, lk.a('p')],
  ),
}
