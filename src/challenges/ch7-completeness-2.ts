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
  'il',
  'ir',
] as const

const pinned = ['il'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), a('q')),
    o.p2.implication(o.p1.negation(a('q')), o.p1.negation(a('p'))),
  ),
)

const solution = z.ir(
  z.ir(
    z.sRotLF(
      z.il(
        z.sRotRF(z.nr(z.sRotLF(z.swl(o.p1.negation(a('q')), i.i(a('p')))))),
        z.sRotLF(z.nl(z.sRotRF(z.swr(o.p1.negation(a('p')), i.i(a('q')))))),
      ),
    ),
  ),
)

export const ch7completeness2 = tutorial({ rules, goal, solution, pinned })
