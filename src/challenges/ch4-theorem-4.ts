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
    o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
    o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
  ),
)

const solution = z.ir(
  i.i(o.p2.implication(a('q'), o.p2.implication(a('r'), a('q')))),
)

export const ch4theorem4 = tutorial({ rules, goal, solution, pinned })
