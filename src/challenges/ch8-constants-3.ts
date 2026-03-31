import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/challenge'

export const ch8constants3: Configuration<AnySequent> = {
  rules: ['f', 'v', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'],
  goal: sequent(
    [lk.a('p'), lk.o.p0.verum, lk.a('q')],
    [lk.a('q'), lk.o.p0.verum, lk.a('p')],
  ),
}
