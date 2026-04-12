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
  'cl',
  'dr',
] as const

const pinned = ['cl', 'dr'] as const

const goal = sequent(
  [
    o.p2.conjunction(
      o.p2.disjunction(a('r'), a('p')),
      o.p2.disjunction(a('p'), a('s')),
    ),
  ],

  [
    o.p2.disjunction(
      o.p2.disjunction(a('s'), a('p')),
      o.p2.disjunction(a('r'), a('p')),
    ),
  ],
)

const solution = z.cl(
  z.dr(
    z.swl(
      o.p2.disjunction(a('p'), a('s')),
      z.swr(
        o.p2.disjunction(a('s'), a('p')),
        i.i(o.p2.disjunction(a('r'), a('p'))),
      ),
    ),
  ),
)

export const ch5composition6 = tutorial({ rules, goal, solution, pinned })
