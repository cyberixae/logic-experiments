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
    o.p2.implication(a('p'), o.p2.implication(a('q'), a('r'))),
    o.p2.implication(a('q'), o.p2.implication(a('p'), a('r'))),
  ),
)

const solution = z.ir(
  z.ir(
    z.ir(
      z.sRotLF(
        z.il(
          z.sRotRF(z.swr(a('r'), z.sRotLF(z.swl(a('q'), i.i(a('p')))))),
          z.il(
            z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q'))))),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore TODO: fix type error
            z.sRotLF(z.sRotLF(z.swl(a('p'), z.swl(a('q'), i.i(a('r')))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation5 = challenge({ rules, goal, solution })
