import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

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

const goal = sequent(
  [o.p1.negation(o.p1.negation(a('s')))],
  [o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s')))))],
)

const solution = z.nr(z.nl(i.i(o.p1.negation(o.p1.negation(a('s'))))))

export const ch3negation4 = tutorial({ rules, goal, solution, pinned })
