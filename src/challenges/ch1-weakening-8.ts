import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [a('p'), o.p2.implication(a('q'), a('p')), a('q')],
  [a('q'), o.p2.implication(a('q'), a('p')), a('p')],
)

const solution = z.swl(
  a('q'),
  z.swl(
    o.p2.implication(a('q'), a('p')),
    z.swr(a('q'), z.swr(o.p2.implication(a('q'), a('p')), i.i(a('p')))),
  ),
)

export const ch1weakening8 = challenge({ rules, goal, solution })
