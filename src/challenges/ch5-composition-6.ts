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
  'cl',
  'dr',
] as const

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

export const ch5composition6 = challenge({ rules, goal, solution })
