import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

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
  'ir',
] as const

const pinned = ['ir'] as const

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

export const ch4theorem7 = tutorial({ rules, goal, solution, pinned })
