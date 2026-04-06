import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

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

const goal = sequent(
  [
    o.p2.implication(a('q'), a('p')),
    o.p2.implication(a('p'), a('s')),
    o.p2.implication(a('s'), a('r')),
  ],
  [
    o.p2.implication(a('r'), a('p')),
    o.p2.implication(a('p'), a('s')),
    o.p2.implication(a('s'), a('q')),
  ],
)

const solution = z.sRotLF(
  z.sRotRF(
    z.swl(
      o.p2.implication(a('q'), a('p')),
      z.swl(
        o.p2.implication(a('s'), a('r')),
        z.swr(
          o.p2.implication(a('s'), a('q')),
          z.swr(
            o.p2.implication(a('r'), a('p')),
            i.i(o.p2.implication(a('p'), a('s'))),
          ),
        ),
      ),
    ),
  ),
)

export const ch2permutation7 = challenge({ rules, goal, solution })
