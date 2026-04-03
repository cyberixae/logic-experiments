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
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p1.negation(o.p2.conjunction(a('p'), a('q'))),
    o.p2.disjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
  ),
)

const solution = z.ir(
  z.nl(
    z.cr(
      z.sRotRF(z.dr(z.nr(z.swr(o.p1.negation(a('q')), i.i(a('p')))))),
      z.sRotRF(
        z.dr(
          z.sRotRF(
            z.sRotRF(z.nr(z.sRotRF(z.swr(o.p1.negation(a('p')), i.i(a('q')))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch6branching6 = challenge({ rules, goal, solution })
