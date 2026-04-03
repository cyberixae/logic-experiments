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
  'cl',
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.disjunction(
      o.p2.conjunction(a('p'), a('q')),
      o.p2.conjunction(a('p'), a('r')),
    ),
    o.p2.conjunction(a('p'), o.p2.disjunction(a('q'), a('r'))),
  ),
)

const solution = z.ir(
  z.dl(
    z.cl(
      z.cr(
        z.swl(a('q'), i.i(a('p'))),
        z.dr(z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q'))))))),
      ),
    ),
    z.cl(
      z.cr(
        z.swl(a('r'), i.i(a('p'))),
        z.dr(z.sRotLF(z.swl(a('p'), z.swr(a('q'), i.i(a('r')))))),
      ),
    ),
  ),
)

export const ch6branching9 = challenge({ rules, goal, solution })
