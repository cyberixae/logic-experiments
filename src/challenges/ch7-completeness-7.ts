import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
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
  'il',
  'ir',
] as const

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

export const ch7completeness7 = challenge({ rules, goal, solution })
