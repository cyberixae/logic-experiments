import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i'] as const

const goal = sequent(
  [o.p2.disjunction(a('r'), a('s'))],
  [o.p2.disjunction(a('r'), a('s'))],
)

const solution = i.i(o.p2.disjunction(a('r'), a('s')))

export const ch0identity5 = challenge({ rules, goal, solution })
