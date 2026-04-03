import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr', 'ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p')))),
    o.p2.implication(a('p'), a('p')),
  ),
)

const solution = z.ir(
  z.swl(
    o.p2.implication(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p')))),
    z.ir(i.i(a('p'))),
  ),
)

export const ch4theorem7 = challenge({ rules, goal, solution })
