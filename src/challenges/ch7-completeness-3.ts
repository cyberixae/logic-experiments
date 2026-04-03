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
  'il',
  'ir',
] as const

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
          z.sRotRF(
            z.swr(
              a('r'),
              z.sRotLF(z.swl(o.p2.implication(a('q'), a('r')), i.i(a('p')))),
            ),
          ),
          z.sRotLF(
            z.il(
              z.sRotLF(z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
              // @ts-expect-error TODO: fix type error
              z.sRotLF(z.sRotLF(z.swl(a('q'), z.swl(a('p'), i.i(a('r')))))),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness3 = challenge({ rules, goal, solution })
