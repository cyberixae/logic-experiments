import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
] as const

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

const solution = z.sRotRF(
  z.swl(
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
    z.swr(
      o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
      i.i(o.p1.negation(o.p1.negation(a('p')))),
    ),
  ),
)

export const ch3negation7 = challenge({ rules, goal, solution })
