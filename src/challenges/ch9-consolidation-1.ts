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
  o.p2.disjunction(
    o.p2.disjunction(a('r'), a('s')),
    o.p2.implication(
      o.p2.conjunction(
        o.p2.implication(a('q'), a('r')),
        o.p2.conjunction(a('p'), a('q')),
      ),
      o.p2.implication(a('q'), a('r')),
    ),
  ),
)

const solution = z.dr(
  z.sRotRF(
    z.ir(
      z.cl(
        z.sRotRF(
          z.swl(
            o.p2.conjunction(a('p'), a('q')),
            z.swr(
              o.p2.disjunction(a('r'), a('s')),
              i.i(o.p2.implication(a('q'), a('r'))),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation1 = challenge({ rules, goal, solution })
