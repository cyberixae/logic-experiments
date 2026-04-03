import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i'] as const

const goal = sequent(
  [o.p2.conjunction(a('q'), a('r'))],
  [o.p2.conjunction(a('q'), a('r'))],
)

const solution = i.i(o.p2.conjunction(a('q'), a('r')))

export const ch0identity4 = challenge({ rules, goal, solution })
