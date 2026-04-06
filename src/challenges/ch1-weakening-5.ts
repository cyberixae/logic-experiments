import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr'] as const

const goal = sequent(
  [o.p2.conjunction(a('p'), a('q')), a('p')],
  [a('q'), o.p2.conjunction(a('p'), a('q'))],
)

const solution = z.swl(
  a('p'),
  z.swr(a('q'), i.i(o.p2.conjunction(a('p'), a('q')))),
)

export const ch1weakening5 = challenge({ rules, goal, solution })
