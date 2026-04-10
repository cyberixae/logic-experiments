import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(o.p2.implication(a('p'), a('p')))

const solution = z.ir(i.i(a('p')))

export const ch9consolidation7 = challenge({ rules, goal, solution })
