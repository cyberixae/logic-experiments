import { lk } from '../systems/lk'
import { AnySequent, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch7completeness1: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'il', 'ir'],
  goal: sequent(
    [lk.a('p'), lk.o.p2.implication(lk.a('p'), lk.a('q'))],
    [lk.a('q')],
  ),
}
