import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p')))),
    o.p2.implication(a('p'), o.p0.verum),
  ),
)

const solution = z.ir(
  z.ir(
    z.swl(
      a('p'),
      z.swl(
        o.p2.implication(
          a('p'),
          o.p2.implication(a('q'), o.p1.negation(a('p'))),
        ),
        i.v(),
      ),
    ),
  ),
)

export const ch8constants5 = challenge({ rules, goal, solution })
