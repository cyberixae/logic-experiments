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
  'dl',
  'cr',
] as const

const pinned = ['dl', 'cr'] as const

const goal = sequent(
  [o.p2.disjunction(a('p'), a('p'))],
  [o.p2.conjunction(a('p'), a('p'))],
)

const solution = z.dl(
  z.cr(i.i(a('p')), i.i(a('p'))),
  z.cr(i.i(a('p')), i.i(a('p'))),
)

export const ch6branching3 = tutorial({ rules, goal, solution, pinned })
