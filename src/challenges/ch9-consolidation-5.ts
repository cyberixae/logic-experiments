import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

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
          z.sRotLF(z.sRotRF(z.swl(a('q'), z.swr(a('r'), i.i(a('p')))))),
          z.il(
            z.sRotRF(z.swl(a('p'), z.swr(a('r'), i.i(a('q'))))),
            z.sRotLB(z.swl(a('p'), z.swl(a('q'), i.i(a('r'))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation5 = challenge({ rules, goal, solution })
