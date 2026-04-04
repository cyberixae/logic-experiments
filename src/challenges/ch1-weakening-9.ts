import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = lk

const rules = ['i', 'swl', 'swr'] as const

const goal = sequent(
  [a('s'), a('r'), a('q'), a('p')],
  [a('p'), a('q'), a('r'), a('s')],
)

const solution = z.swl(
  a('p'),
  z.swl(
    a('q'),
    z.swl(a('r'), z.swr(a('p'), z.swr(a('q'), z.swr(a('r'), i.i(a('s')))))),
  ),
)

export const ch1weakening9 = challenge({ rules, goal, solution })
