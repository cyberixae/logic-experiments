import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr', 'nl', 'nr', 'ir'] as const

const pinned = ['ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p1.negation(a('s'))),
    o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
  ),
)

const solution = z.ir(z.nr(z.nl(i.i(o.p1.negation(o.p1.negation(a('s')))))))

export const ch4theorem8 = tutorial({ rules, goal, solution, pinned })
