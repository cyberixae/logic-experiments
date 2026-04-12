import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const pinned = ['i'] as const

const goal = sequent(
  [
    o.p2.implication(
      o.p2.disjunction(a('p'), o.p1.negation(a('q'))),
      o.p1.negation(o.p2.conjunction(a('r'), a('s'))),
    ),
  ],
  [
    o.p2.implication(
      o.p2.disjunction(a('p'), o.p1.negation(a('q'))),
      o.p1.negation(o.p2.conjunction(a('r'), a('s'))),
    ),
  ],
)

const solution = i.i(
  o.p2.implication(
    o.p2.disjunction(a('p'), o.p1.negation(a('q'))),
    o.p1.negation(o.p2.conjunction(a('r'), a('s'))),
  ),
)

export const ch0identity9 = tutorial({ rules, goal, solution, pinned })
