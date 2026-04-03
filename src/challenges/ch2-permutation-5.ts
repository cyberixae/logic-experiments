import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

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

export const ch2permutation5 = challenge({ rules, goal, solution })
