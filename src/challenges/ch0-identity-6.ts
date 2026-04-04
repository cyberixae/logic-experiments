import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, i } = lk

const rules = ['i'] as const

const goal = sequent(
  [o.p2.implication(a('r'), a('p'))],
  [o.p2.implication(a('r'), a('p'))],
)

const solution = i.i(o.p2.implication(a('r'), a('p')))

export const ch0identity6 = challenge({ rules, goal, solution })
