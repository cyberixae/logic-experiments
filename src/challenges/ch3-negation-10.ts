import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, i } = rk

const goal = sequent(
  [o.p1.negation(o.p1.negation(a('p')))],
  [o.p1.negation(o.p1.negation(a('p')))],
)

const solution = i.i(o.p1.negation(o.p1.negation(a('p'))))

export const ch3negation10 = challenge({ rules, goal, solution })
