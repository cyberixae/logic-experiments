import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr', 'nl', 'nr', 'ir'] as const

const pinned = ['ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q')))),

    o.p1.negation(
      o.p1.negation(
        o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q')))),
      ),
    ),
  ),
)

const solution = z.ir(
  z.nr(
    z.nl(i.i(o.p1.negation(o.p1.negation(o.p2.conjunction(a('p'), a('q')))))),
  ),
)

export const ch4theorem9 = tutorial({ rules, goal, solution, pinned })
