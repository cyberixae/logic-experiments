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
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.disjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
    o.p1.negation(o.p2.conjunction(a('p'), a('q'))),
  ),
)

const solution = z.ir(
  z.nr(
    z.cl(
      z.sRotLF(
        z.dl(
          z.nl(z.swl(a('q'), i.i(a('p')))),
          z.nl(z.sRotLF(z.swl(a('p'), i.i(a('q'))))),
        ),
      ),
    ),
  ),
)

export const ch6branching7 = challenge({ rules, goal, solution })
