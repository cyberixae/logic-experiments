import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr'] as const

const goal = sequent(
  [a('q'), o.p2.conjunction(a('p'), a('q'))],
  [o.p2.conjunction(a('q'), a('p')), a('q')],
)

const solution = z.swl(
  o.p2.conjunction(a('p'), a('q')),
  z.swr(o.p2.conjunction(a('q'), a('p')), i.i(a('q'))),
)

export const ch1weakening4 = challenge({ rules, goal, solution })
