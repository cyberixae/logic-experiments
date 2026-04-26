import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = rk

const goal = sequent(
  [a('p'), a('q'), a('q'), a('p')],
  [a('p'), a('q'), a('q'), a('p')],
)

const solution = z.swl(
  a('p'),
  z.swl(
    a('q'),
    z.swl(a('q'), z.swr(a('p'), z.swr(a('q'), z.swr(a('q'), i.i(a('p')))))),
  ),
)

export const ch1weakening6 = challenge({ rules, goal, solution })
