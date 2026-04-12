import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, i } = rk

const rules = ['i'] as const

const pinned = ['i'] as const

const goal = sequent(
  [o.p2.implication(a('r'), a('p'))],
  [o.p2.implication(a('r'), a('p'))],
)

const solution = i.i(o.p2.implication(a('r'), a('p')))

export const ch0identity6 = tutorial({ rules, goal, solution, pinned })
