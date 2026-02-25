import { last } from './lib/array'
import { Derivation } from './lib/derivation'
import {
  AnyJudgement as AnySequent,
  conclusion,
  Formulas,
  Judgement as Sequent,
  judgement as sequent,
} from './lib/judgement'
import { lk, Prop, SWL } from './systems/lk'

const example = {
  state: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.o.p2.implication(lk.a('p'), lk.a('p')),
    ),
  ),
  rule: 'goal' as const,
  op: {
    state: conclusion(
      lk.o.p2.implication(
        lk.o.p2.implication(
          lk.a('p'),
          lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
        ),
        lk.o.p2.implication(lk.a('p'), lk.a('p')),
      ),
    ),
    rule: 'ir' as const,
    op: {
      state: sequent(
        [
          lk.o.p2.implication(
            lk.a('p'),
            lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
          ),
        ],
        [lk.o.p2.implication(lk.a('p'), lk.a('p'))],
      ),
      rule: 'wl' as const,
      op: {
        state: sequent([], [lk.o.p2.implication(lk.a('p'), lk.a('p'))]),
        rule: 'ir' as const,
        op: {
          state: sequent([lk.a('p')], [lk.a('p')]),
          rule: 'I' as const,
        },
      },
    },
  },
}
