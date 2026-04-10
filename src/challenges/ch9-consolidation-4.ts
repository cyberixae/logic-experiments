import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(o.p2.disjunction(a('p'), o.p1.negation(a('p'))))

const solution = z.dr(z.sRotRF(z.nr(i.i(a('p')))))

export const ch9consolidation4 = challenge({ rules, goal, solution })
