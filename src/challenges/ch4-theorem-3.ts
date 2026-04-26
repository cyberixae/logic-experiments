import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), a('r')),
    o.p2.implication(a('p'), a('r')),
  ),
)

const solution = z.ir(i.i(o.p2.implication(a('p'), a('r'))))

export const ch4theorem3 = challenge({ rules, goal, solution })
