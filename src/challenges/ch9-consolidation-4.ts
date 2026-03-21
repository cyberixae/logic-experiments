import { lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch9consolidation4: Configuration<AnySequent> = {
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
  goal: conclusion(lk.o.p2.implication(lk.a('p'), lk.a('p'))),
}
