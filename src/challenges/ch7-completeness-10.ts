import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, i } = rk

const goal = sequent(
  [
    o.p2.implication(
      o.p2.disjunction(a('p'), a('q')),
      o.p2.conjunction(a('p'), a('q')),
    ),
  ],
  [
    o.p2.implication(
      o.p2.disjunction(a('p'), a('q')),
      o.p2.conjunction(a('p'), a('q')),
    ),
  ],
)

const solution = i.i(
  o.p2.implication(
    o.p2.disjunction(a('p'), a('q')),
    o.p2.conjunction(a('p'), a('q')),
  ),
)

export const ch7completeness10 = challenge({ rules, goal, solution })
