import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr', 'nl', 'nr', 'ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p1.negation(a('s'))),
    o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
  ),
)

const solution = z.ir(z.nr(z.nl(i.i(o.p1.negation(o.p1.negation(a('s')))))))

export const ch4theorem8 = challenge({ rules, goal, solution })
