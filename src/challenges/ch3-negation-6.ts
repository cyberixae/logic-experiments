import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
  ],
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
  ],
)

const solution = z.sRotLF(
  z.swl(
    o.p1.negation(o.p1.negation(a('p'))),
    z.swr(
      o.p1.negation(o.p1.negation(a('p'))),
      i.i(o.p1.negation(o.p1.negation(o.p1.negation(a('p'))))),
    ),
  ),
)

export const ch3negation6 = challenge({ rules, goal, solution })
