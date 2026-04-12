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
  'cl',
  'dr',
  'ir',
] as const

const pinned = ['cl', 'dr'] as const

const goal = sequent(
  [o.p2.conjunction(a('q'), o.p1.negation(a('p')))],
  [o.p2.conjunction(a('q'), o.p1.negation(a('p')))],
)

const solution = i.i(o.p2.conjunction(a('q'), o.p1.negation(a('p'))))

export const ch5composition11 = tutorial({ rules, goal, solution, pinned })
