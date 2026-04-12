import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const pinned = ['f', 'v'] as const

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p1.negation(o.p0.falsum)),
    o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
  ),
)

const solution = z.ir(
  z.nl(
    z.nr(
      z.swr(
        o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
        i.f(),
      ),
    ),
  ),
)

export const ch8constants6 = tutorial({ rules, goal, solution, pinned })
