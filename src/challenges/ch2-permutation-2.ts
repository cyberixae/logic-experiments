import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = rk

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
