import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p2.conjunction(
      o.p2.conjunction(a('r'), a('p')),
      o.p2.disjunction(a('p'), a('r')),
    ),
  ],

  [
    o.p2.disjunction(
      o.p2.conjunction(a('p'), a('r')),
      o.p2.disjunction(a('r'), a('p')),
    ),
  ],
)

const solution = z.cl(
  z.dr(
    z.dl(
      z.swr(
        o.p2.conjunction(a('p'), a('r')),
        z.dr(
          z.sRotLB(
            z.swl(o.p2.conjunction(a('r'), a('p')), z.swr(a('r'), i.i(a('p')))),
          ),
        ),
      ),
      z.swr(
        o.p2.conjunction(a('p'), a('r')),
        z.dr(
          z.sRotLB(
            z.sRotRB(
              z.swl(
                o.p2.conjunction(a('r'), a('p')),
                z.swr(a('p'), i.i(a('r'))),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch5composition5 = challenge({ rules, goal, solution })
