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
  o.p2.implication(a('r'), o.p2.implication(a('q'), a('q'))),
)

const solution = z.ir(z.swl(a('r'), z.ir(i.i(a('q')))))

export const ch4theorem6 = tutorial({ rules, goal, solution, pinned })
