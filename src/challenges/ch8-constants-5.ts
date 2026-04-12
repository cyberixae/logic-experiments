import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const pinned = ['f', 'v'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p')))),
    o.p2.implication(a('p'), o.p0.verum),
  ),
)

const solution = z.ir(
  z.ir(
    z.swl(
      a('p'),
      z.swl(
        o.p2.implication(
          a('p'),
          o.p2.implication(a('q'), o.p1.negation(a('p'))),
        ),
        i.v(),
      ),
    ),
  ),
)

export const ch8constants5 = tutorial({ rules, goal, solution, pinned })
