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
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const pinned = ['dl', 'cr'] as const

const goal = sequent(
  [o.p2.disjunction(a('r'), a('s'))],
  [o.p2.disjunction(a('r'), a('s'))],
)

const solution = i.i(o.p2.disjunction(a('r'), a('s')))

export const ch6branching10 = tutorial({ rules, goal, solution, pinned })
