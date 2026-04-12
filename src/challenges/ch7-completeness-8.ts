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
    o.p2.implication(o.p2.implication(a('p'), a('q')), a('q')),
    o.p2.implication(o.p2.implication(a('q'), a('p')), a('p')),
  ),
)

const solution = z.ir(
  z.ir(
    z.sRotLF(
      z.il(
        z.ir(
          z.sRotLF(
            z.swl(o.p2.implication(a('q'), a('p')), z.swr(a('q'), i.i(a('p')))),
          ),
        ),
        z.sRotLF(
          z.il(
            z.sRotRF(z.swr(a('p'), i.i(a('q')))),
            z.sRotLF(z.swl(a('q'), i.i(a('p')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness8 = tutorial({ rules, goal, solution, pinned })
