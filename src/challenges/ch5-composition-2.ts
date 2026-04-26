import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent([a('q'), a('p')], [o.p2.disjunction(a('p'), a('q'))])

const solution = z.dr(z.swl(a('p'), z.swr(a('p'), i.i(a('q')))))

export const ch5composition2 = challenge({ rules, goal, solution })
