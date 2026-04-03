import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
    o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
  ),
)

const solution = z.ir(
  i.i(o.p2.implication(a('q'), o.p2.implication(a('r'), a('q')))),
)

export const ch4theorem4 = challenge({ rules, goal, solution })
