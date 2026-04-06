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
  'cl',
  'cr',
  'il',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(o.p2.conjunction(a('p'), a('q')), a('r')),

    o.p2.implication(a('p'), o.p2.implication(a('q'), a('r'))),
  ),
)

const solution = z.ir(
  z.ir(
    z.ir(
      z.sRotLF(
        z.il(
          z.cr(
            z.sRotRF(z.swl(a('q'), z.swr(a('r'), i.i(a('p'))))),
            z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
          ),
          z.sRotLB(z.swl(a('q'), z.swl(a('p'), i.i(a('r'))))),
        ),
      ),
    ),
  ),
)

export const ch7completeness4 = challenge({ rules, goal, solution })
