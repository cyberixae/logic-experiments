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
  [
    o.p2.conjunction(a('q'), a('s')),
    o.p2.conjunction(a('q'), a('s')),
    o.p2.conjunction(a('q'), a('s')),
  ],
  [
    o.p2.conjunction(a('q'), a('s')),
    o.p2.conjunction(a('s'), a('q')),
    o.p2.conjunction(a('s'), a('q')),
  ],
)

const solution = z.sRotRB(
  z.swl(
    o.p2.conjunction(a('q'), a('s')),
    z.swl(
      o.p2.conjunction(a('q'), a('s')),
      z.swr(
        o.p2.conjunction(a('s'), a('q')),
        z.swr(
          o.p2.conjunction(a('s'), a('q')),
          i.i(o.p2.conjunction(a('q'), a('s'))),
        ),
      ),
    ),
  ),
)

export const ch2permutation6 = challenge({ rules, goal, solution })
