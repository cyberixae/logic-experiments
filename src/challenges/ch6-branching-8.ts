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
  'cl',
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const pinned = ['dl', 'cr'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.conjunction(a('p'), o.p2.disjunction(a('q'), a('r'))),
    o.p2.disjunction(
      o.p2.conjunction(a('p'), a('q')),
      o.p2.conjunction(a('p'), a('r')),
    ),
  ),
)

const solution = z.ir(
  z.cl(
    z.dr(
      z.dl(
        z.cr(
          z.sRotRF(
            z.swl(a('q'), z.swr(o.p2.conjunction(a('p'), a('r')), i.i(a('p')))),
          ),
          z.sRotLF(
            z.sRotRF(
              z.swl(
                a('p'),
                z.swr(o.p2.conjunction(a('p'), a('r')), i.i(a('q'))),
              ),
            ),
          ),
        ),
        z.swr(
          o.p2.conjunction(a('p'), a('q')),
          z.cr(
            z.swl(a('r'), i.i(a('p'))),
            z.sRotLF(z.swl(a('p'), i.i(a('r')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch6branching8 = tutorial({ rules, goal, solution, pinned })
