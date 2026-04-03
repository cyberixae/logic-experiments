import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr', 'nl', 'nr'] as const

const goal = sequent(
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
  ],
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
  ],
)

const solution = z.swr(
  o.p1.negation(o.p1.negation(a('p'))),
  z.swr(
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
    z.nl(i.i(o.p1.negation(o.p1.negation(a('p'))))),
  ),
)

export const ch3negation6 = challenge({ rules, goal, solution })
