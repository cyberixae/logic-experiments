import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(o.p2.implication(a('p'), a('q')), a('q')),
    o.p2.implication(o.p2.implication(a('q'), a('p')), a('p')),
  ),
)

const solution = z.ir(
  z.ir(
    z.sRotLB(
      z.il(
        z.ir(
          z.sRotLB(
            z.swl(o.p2.implication(a('q'), a('p')), z.swr(a('q'), i.i(a('p')))),
          ),
        ),
        z.sRotLB(
          z.il(
            z.sRotRB(z.swr(a('p'), i.i(a('q')))),
            z.sRotLB(z.swl(a('q'), i.i(a('p')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch7completeness8 = challenge({ rules, goal, solution })
