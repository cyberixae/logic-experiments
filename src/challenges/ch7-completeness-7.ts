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
  'il',
  'ir',
] as const

const pinned = ['il'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('p'), a('q'))),
    o.p2.implication(a('p'), a('q')),
  ),
)

const solution = z.ir(
  z.il(
    z.sRotRF(z.ir(z.swr(a('q'), i.i(a('p'))))),
    i.i(o.p2.implication(a('p'), a('q'))),
  ),
)

export const ch7completeness7 = tutorial({ rules, goal, solution, pinned })
