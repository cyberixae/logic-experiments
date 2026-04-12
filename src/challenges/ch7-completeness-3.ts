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
  'il',
  'ir',
] as const

const pinned = ['il'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), a('q')),
    o.p2.implication(
      o.p2.implication(a('q'), a('r')),
      o.p2.implication(a('p'), a('r')),
    ),
  ),
)

const solution = z.ir(
  z.ir(
    z.ir(
      z.sRotLF(
        z.il(
          z.sRotLF(
            z.il(
              z.sRotRF(z.swr(a('r'), z.swr(a('q'), i.i(a('p'))))),
              z.sRotLF(z.swl(a('p'), z.swr(a('p'), i.i(a('r'))))),
            ),
          ),
          z.sRotLF(
            z.il(
              z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
              z.sRotLB(z.swl(a('q'), z.swl(a('p'), i.i(a('r'))))),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness3 = tutorial({ rules, goal, solution, pinned })
