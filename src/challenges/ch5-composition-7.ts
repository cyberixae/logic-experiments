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
  [
    o.p2.conjunction(
      o.p2.conjunction(a('p'), a('q')),
      o.p2.implication(a('r'), a('q')),
    ),
  ],
  [
    o.p2.disjunction(
      o.p2.implication(a('q'), a('r')),
      o.p2.disjunction(a('p'), a('q')),
    ),
  ],
)

const solution = z.dr(
  z.ir(
    z.swr(
      a('r'),
      z.dr(
        z.sRotLF(
          z.swl(
            o.p2.conjunction(
              o.p2.conjunction(a('p'), a('q')),
              o.p2.implication(a('r'), a('q')),
            ),
            z.swr(a('p'), i.i(a('q'))),
          ),
        ),
      ),
    ),
  ),
)

export const ch5composition7 = tutorial({ rules, goal, solution, pinned })
