import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, i } = rk

const rules = ['i', 'swl', 'swr'] as const

const pinned = ['swl', 'swr'] as const

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

export const ch1weakening7 = tutorial({ rules, goal, solution, pinned })
