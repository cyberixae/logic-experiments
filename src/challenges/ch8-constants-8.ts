import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const pinned = ['f', 'v'] as const

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

export const ch8constants8 = tutorial({ rules, goal, solution, pinned })
