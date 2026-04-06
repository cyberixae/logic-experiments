import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

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
    o.p1.negation(o.p1.negation(o.p0.falsum)),
    o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
  ),
)

const solution = z.ir(
  z.nl(
    z.nr(
      z.swr(
        o.p1.negation(o.p1.negation(o.p1.negation(o.p1.negation(a('s'))))),
        i.f(),
      ),
    ),
  ),
)

export const ch8constants6 = challenge({ rules, goal, solution })
