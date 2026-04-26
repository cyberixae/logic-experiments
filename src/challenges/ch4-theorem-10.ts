import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, i } = rk

const goal = sequent(
  [o.p2.implication(a('r'), a('p'))],
  [o.p2.implication(a('r'), a('p'))],
)

const solution = i.i(o.p2.implication(a('r'), a('p')))

export const ch4theorem10 = challenge({ rules, goal, solution })
