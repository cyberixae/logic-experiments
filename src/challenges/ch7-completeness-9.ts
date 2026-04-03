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
  'il',
  'ir',
] as const

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
          z.swl(a('q'), z.sRotRF(z.swr(a('r'), i.i(a('p'))))),
          z.il(
            z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
            z.sRotLF(z.sRotLF(z.swl(a('q'), z.swl(a('p'), i.i(a('r')))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness9 = challenge({ rules, goal, solution })
