import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

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
      z.sRotLB(
        z.il(
          z.il(
            z.sRotRB(z.swr(a('q'), z.swr(a('r'), i.i(a('p'))))),
            z.sRotLB(z.sRotRB(z.swl(a('p'), z.swr(a('r'), i.i(a('q')))))),
          ),
          z.sRotLB(
            z.swl(o.p2.implication(a('p'), a('q')), z.swl(a('p'), i.i(a('r')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness3 = challenge({ rules, goal, solution })
