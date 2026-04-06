import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

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
  'cl',
  'dr',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.conjunction(a('q'), o.p1.negation(a('q'))),
    o.p2.disjunction(a('r'), a('s')),
  ),
)

const solution = z.ir(
  z.cl(z.nl(z.sRotRF(z.swr(o.p2.disjunction(a('r'), a('s')), i.i(a('q')))))),
)

export const ch5composition8 = challenge({ rules, goal, solution })
