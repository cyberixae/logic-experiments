import { rev, lk, Rev } from '../systems/lk'
import { AnySequent, conclusion, sequent } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const ch3negation8: Configuration<AnySequent> = {
  rules: ['i', 'swl', 'swr', 'sRotLF', 'sRotRF', 'sRotLB', 'sRotRB', 'nl', 'nr'],
  goal: sequent([

    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    ),
    lk.o.p2.conjunction(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    ),
  
  ], [
    lk.o.p1.negation(
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    ),
    ),

    lk.o.p2.conjunction(
    lk.o.p1.negation(
      lk.a('p'), 
    ),
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
    lk.o.p1.negation(
    lk.o.p1.negation(
      lk.a('q'),
    ),
    ),
  
  ]),
}
