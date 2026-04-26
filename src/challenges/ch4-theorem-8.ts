import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p1.negation(a('s'))),
    o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
  ),
)

const solution = z.ir(z.nr(z.nl(i.i(o.p1.negation(o.p1.negation(a('s')))))))

export const ch4theorem8 = challenge({ rules, goal, solution })
