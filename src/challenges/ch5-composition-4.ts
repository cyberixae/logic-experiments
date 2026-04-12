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
  'cl',
  'dr',
  'ir',
] as const

const pinned = ['cl', 'dr'] as const

const goal = sequent(
  [o.p2.conjunction(o.p2.conjunction(a('r'), a('p')), a('s'))],
  [o.p2.disjunction(a('s'), o.p2.disjunction(a('p'), a('r')))],
)

const solution = z.cl(
  z.dr(
    z.swl(
      a('s'),
      z.cl(z.swr(a('s'), z.dr(z.swl(a('p'), z.swr(a('p'), i.i(a('r'))))))),
    ),
  ),
)

export const ch5composition4 = tutorial({ rules, goal, solution, pinned })
