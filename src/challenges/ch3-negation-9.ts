import { rev, lk, RuleId } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation9: Configuration<AnySequent> = {
  rules: [
    'i',
    'swl',
    'swr',
    'sRotLF',
    'sRotRF',
    'sRotLB',
    'sRotRB',
    'nl',
    'nr',
  ],
  goal: sequent(
    [
      lk.o.p1.negation(lk.a('p')),
      lk.o.p1.negation(lk.a('s')),
      lk.o.p1.negation(lk.a('p')),
      lk.a('r'),
    ],
    [
      lk.a('q'),
      lk.o.p1.negation(lk.a('q')),
      lk.a('s'),
      lk.o.p1.negation(lk.a('r')),
    ],
  ),
}
