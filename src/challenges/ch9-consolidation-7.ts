import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.disjunction(
    o.p2.implication(a('r'), a('p')),
    o.p2.conjunction(
      o.p2.conjunction(
        a('r'),
        o.p2.conjunction(
          a('r'),
          o.p2.disjunction(
            o.p2.conjunction(a('r'), o.p2.implication(a('s'), a('p'))),
            o.p2.disjunction(a('r'), a('p')),
          ),
        ),
      ),
      o.p2.implication(o.p0.falsum, a('q')),
    ),
  ),
)

const solution = z.dr(
  z.ir(
    z.swr(
      a('p'),
      z.cr(
        z.cr(
          i.i(a('r')),
          z.cr(
            i.i(a('r')),
            z.dr(
              z.swr(
                o.p2.conjunction(a('r'), o.p2.implication(a('s'), a('p'))),
                z.dr(z.sRotRF(z.swr(a('p'), i.i(a('r'))))),
              ),
            ),
          ),
        ),
        z.ir(z.sRotLF(z.swl(a('r'), z.swr(a('q'), i.f())))),
      ),
    ),
  ),
)

export const ch9consolidation7 = challenge({ rules, goal, solution })
