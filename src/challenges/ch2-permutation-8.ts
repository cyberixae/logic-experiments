import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p2.conjunction(a('s'), a('q')),
    a('r'),
    o.p2.implication(a('q'), a('p')),
    o.p1.negation(a('r')),
  ],
  [
    o.p1.negation(a('p')),
    o.p2.implication(a('s'), a('q')),
    o.p1.negation(a('r')),
    o.p2.disjunction(a('q'), a('p')),
  ],
)

const solution = z.sRotLB(
  z.sRotRF(
    z.swl(
      o.p2.implication(a('q'), a('p')),
      z.swl(
        a('r'),
        z.swl(
          o.p2.conjunction(a('s'), a('q')),
          z.swr(
            o.p2.disjunction(a('q'), a('p')),
            z.swr(
              o.p1.negation(a('p')),
              z.swr(
                o.p2.implication(a('s'), a('q')),
                i.i(o.p1.negation(a('r'))),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch2permutation8 = challenge({ rules, goal, solution })
