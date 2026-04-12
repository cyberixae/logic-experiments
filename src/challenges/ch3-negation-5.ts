import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
] as const

const pinned = ['nl', 'nr'] as const

const goal = sequent(
  [o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q'))))],
  [
    o.p1.negation(
      o.p1.negation(
        o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q')))),
      ),
    ),
  ],
)

const solution = z.nr(
  z.nl(i.i(o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q')))))),
)

export const ch3negation5 = tutorial({ rules, goal, solution, pinned })
