import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'nl', 'nr'] as const

const goal = sequent([], [o.p1.negation(a('r')), a('r')])

const solution = z.nr(i.i(a('r')))

export const ch3negation2 = challenge({ rules, goal, solution })
