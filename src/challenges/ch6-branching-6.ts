import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p2.conjunction(a('p'), a('q'))),
    o.p2.disjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
  ),
)

const solution = z.ir(
  z.nl(
    z.cr(
      z.sRotRF(z.dr(z.nr(z.swr(o.p1.negation(a('q')), i.i(a('p')))))),
      z.sRotRF(z.dr(z.swr(o.p1.negation(a('p')), z.nr(i.i(a('q')))))),
    ),
  ),
)

export const ch6branching6 = challenge({ rules, goal, solution })
