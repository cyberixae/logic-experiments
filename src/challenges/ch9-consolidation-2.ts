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
    a('p'),
    o.p2.implication(
      o.p1.negation(o.p2.disjunction(a('p'), a('q'))),
      o.p2.implication(a('q'), a('r')),
    ),
  ),
)

const solution = z.ir(
  z.ir(
    z.nl(
      z.dr(
        z.sRotRF(
          z.sRotRF(
            z.swr(a('q'), z.swr(o.p2.implication(a('q'), a('r')), i.i(a('p')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation2 = challenge({ rules, goal, solution })
