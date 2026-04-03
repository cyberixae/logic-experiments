import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'nl', 'nr'] as const

const goal = sequent([o.p1.negation(o.p1.negation(a('q')))], [a('q')])

const solution = z.nl(z.nr(i.i(a('q'))))

export const ch3negation3 = challenge({ rules, goal, solution })
