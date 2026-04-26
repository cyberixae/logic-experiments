import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [o.p1.negation(a('p')), o.p1.negation(a('s')), o.p1.negation(a('p')), a('r')],
  [a('q'), o.p1.negation(a('q')), a('s'), o.p1.negation(a('r'))],
)

const solution = z.sRotRB(
  z.nr(
    z.sRotLB(
      z.swl(
        a('r'),
        z.swl(
          o.p1.negation(a('p')),
          z.swl(
            o.p1.negation(a('s')),
            z.swl(
              o.p1.negation(a('p')),
              z.swr(a('s'), z.swr(o.p1.negation(a('r')), i.i(a('q')))),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch3negation9 = challenge({ rules, goal, solution })
