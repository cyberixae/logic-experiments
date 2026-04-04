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

const goal = sequent([a('q')], [a('p'), a('p'), a('p'), a('q'), a('p'), a('p')])

const solution = z.sRotRF(
  z.sRotRF(
    z.swr(
      a('p'),
      z.swr(a('p'), z.swr(a('p'), z.swr(a('p'), z.swr(a('p'), i.i(a('q')))))),
    ),
  ),
)
export const ch2permutation2 = challenge({ rules, goal, solution })
