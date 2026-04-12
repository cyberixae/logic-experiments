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
] as const

const pinned = ['sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'] as const

const goal = sequent(
  [o.p2.conjunction(a('p'), a('q')), o.p2.conjunction(a('p'), a('q'))],
  [o.p2.conjunction(a('p'), a('q')), o.p2.disjunction(a('p'), a('q'))],
)

const solution = z.sRotRF(
  z.swl(
    o.p2.conjunction(a('p'), a('q')),
    z.swr(
      o.p2.disjunction(a('p'), a('q')),
      i.i(o.p2.conjunction(a('p'), a('q'))),
    ),
  ),
)

export const ch2permutation5 = tutorial({ rules, goal, solution, pinned })
