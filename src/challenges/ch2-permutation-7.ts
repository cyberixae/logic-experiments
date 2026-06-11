import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p2.implication(a('q'), a('p')),
    o.p2.implication(a('p'), a('s')),
    o.p2.implication(a('s'), a('r')),
  ],
  [
    o.p2.implication(a('r'), a('p')),
    o.p2.implication(a('p'), a('s')),
    o.p2.implication(a('s'), a('q')),
  ],
)

const solution = z.swl(
  o.p2.implication(a('s'), a('r')),
  z.swr(
    o.p2.implication(a('r'), a('p')),
    z.sRotLB(
      z.sRotRB(
        z.swl(
          o.p2.implication(a('q'), a('p')),
          z.swr(
            o.p2.implication(a('s'), a('q')),
            i.i(o.p2.implication(a('p'), a('s'))),
          ),
        ),
      ),
    ),
  ),
)

export const ch2permutation7 = challenge({ rules, goal, solution })
