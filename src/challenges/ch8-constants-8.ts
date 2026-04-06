import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

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
    o.p2.implication(a('p'), a('q')),
    o.p2.implication(
      o.p2.implication(a('q'), o.p0.falsum),
      o.p2.implication(a('p'), a('r')),
    ),
  ),
)

const solution = z.ir(
  z.ir(
    z.sRotLF(
      z.il(
        z.sRotRF(
          z.ir(
            z.sRotLF(
              z.swl(
                o.p2.implication(a('q'), o.p0.falsum),
                z.swr(a('r'), i.i(a('p'))),
              ),
            ),
          ),
        ),
        z.sRotLF(
          z.il(
            z.sRotRF(z.swr(o.p2.implication(a('p'), a('r')), i.i(a('q')))),
            z.sRotLF(
              z.swl(a('q'), z.swr(o.p2.implication(a('p'), a('r')), i.f())),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch8constants8 = challenge({ rules, goal, solution })
