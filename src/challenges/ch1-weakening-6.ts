import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, z, i } = rk

const rules = ['i', 'swl', 'swr'] as const

const pinned = ['swl', 'swr'] as const

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

export const ch1weakening6 = tutorial({ rules, goal, solution, pinned })
