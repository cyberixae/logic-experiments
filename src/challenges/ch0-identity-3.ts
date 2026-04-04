import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, i } = lk

const rules = ['i'] as const

const goal = sequent([o.p1.negation(a('p'))], [o.p1.negation(a('p'))])

const solution = i.i(o.p1.negation(a('p')))

export const ch0identity3 = challenge({ rules, goal, solution })
