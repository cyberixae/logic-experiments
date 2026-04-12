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
] as const

const pinned = ['nl', 'nr'] as const

const goal = sequent(
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('q')))),
  ],
  [
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),

    o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
    o.p1.negation(o.p1.negation(a('q'))),
  ],
)

const solution = z.sRotLF(
  z.sRotRF(
    z.swl(
      o.p1.negation(o.p1.negation(a('p'))),
      z.swl(
        o.p1.negation(o.p1.negation(o.p1.negation(a('q')))),
        z.swr(
          o.p1.negation(o.p1.negation(a('q'))),
          z.swr(
            o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
            i.i(o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch3negation8 = tutorial({ rules, goal, solution, pinned })
