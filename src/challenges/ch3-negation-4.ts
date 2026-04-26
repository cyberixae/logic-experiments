import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [o.p1.negation(o.p1.negation(a('s')))],
  [o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s')))))],
)

const solution = z.nr(z.nl(i.i(o.p1.negation(o.p1.negation(a('s'))))))

export const ch3negation4 = challenge({ rules, goal, solution })
