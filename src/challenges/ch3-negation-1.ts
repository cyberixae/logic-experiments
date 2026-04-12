import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'nl', 'nr'] as const

const pinned = ['nl', 'nr'] as const

const goal = sequent([a('r'), o.p1.negation(a('r'))], [])

const solution = z.nl(i.i(a('r')))

export const ch3negation1 = tutorial({ rules, goal, solution, pinned })
