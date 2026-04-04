import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = lk

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
  [a('s'), a('r'), a('q'), a('p')],
  [a('s'), a('r'), a('q'), a('p')],
)

const solution = z.sRotLB(
  z.swl(
    a('q'),
    z.swl(
      a('r'),
      z.swl(a('s'), z.swr(a('s'), z.swr(a('r'), z.swr(a('q'), i.i(a('p')))))),
    ),
  ),
)

export const ch2permutation4 = challenge({ rules, goal, solution })
