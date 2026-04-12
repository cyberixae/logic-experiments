import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
] as const

const pinned = ['nl', 'nr'] as const

const goal = sequent([o.p1.negation(a('p'))], [o.p1.negation(a('p'))])

const solution = i.i(o.p1.negation(a('p')))

export const ch3negation10 = tutorial({ rules, goal, solution, pinned })
