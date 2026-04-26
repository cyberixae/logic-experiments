import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent([a('r'), o.p1.negation(a('r'))], [])

const solution = z.nl(i.i(a('r')))

export const ch3negation1 = challenge({ rules, goal, solution })
