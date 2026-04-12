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
  'il',
  'ir',
] as const

const pinned = ['il'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('q'), a('r'))),
    o.p2.implication(o.p2.conjunction(a('p'), a('q')), a('r')),
  ),
)

const solution = z.ir(
  z.ir(
    z.cl(
      z.sRotLF(
        z.il(
          z.sRotRF(z.swl(a('q'), z.swr(a('r'), i.i(a('p'))))),
          z.il(
            z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
            z.sRotLB(z.swl(a('q'), z.swl(a('p'), i.i(a('r'))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness9 = tutorial({ rules, goal, solution, pinned })
