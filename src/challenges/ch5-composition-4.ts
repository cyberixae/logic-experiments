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
    z.sRotLF(
      z.sRotRF(
        z.swl(
          o.p2.conjunction(a('r'), a('p')),
          z.swr(o.p2.disjunction(a('p'), a('r')), i.i(a('s'))),
        ),
      ),
    ),
  ),
)

export const ch5composition4 = tutorial({ rules, goal, solution, pinned })
