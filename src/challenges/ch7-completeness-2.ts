import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), a('q')),
    o.p2.implication(o.p1.negation(a('q')), o.p1.negation(a('p'))),
  ),
)

const solution = z.ir(
  z.ir(
    z.sRotLB(
      z.il(
        z.sRotRB(z.nr(z.sRotLB(z.swl(o.p1.negation(a('q')), i.i(a('p')))))),
        z.sRotLB(z.nl(z.sRotRB(z.swr(o.p1.negation(a('p')), i.i(a('q')))))),
      ),
    ),
  ),
)

export const ch7completeness2 = challenge({ rules, goal, solution })
