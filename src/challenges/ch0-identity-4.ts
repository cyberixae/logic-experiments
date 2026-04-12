import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, i } = rk

const rules = ['i'] as const

const pinned = ['i'] as const

const goal = sequent(
  [o.p2.conjunction(a('q'), a('r'))],
  [o.p2.conjunction(a('q'), a('r'))],
)

const solution = i.i(o.p2.conjunction(a('q'), a('r')))

export const ch0identity4 = tutorial({ rules, goal, solution, pinned })
