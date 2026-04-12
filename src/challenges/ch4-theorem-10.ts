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
  'ir',
] as const

const pinned = ['ir'] as const

const goal = sequent(
  [o.p2.implication(a('r'), a('p'))],
  [o.p2.implication(a('r'), a('p'))],
)

const solution = i.i(o.p2.implication(a('r'), a('p')))

export const ch4theorem10 = tutorial({ rules, goal, solution, pinned })
