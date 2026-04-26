import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p1.negation(o.p1.negation(a('p'))),
    o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
    o.p1.negation(o.p1.negation(o.p1.negation(a('q')))),
  ],
  [
    o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),

    o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q'))),
    o.p1.negation(o.p1.negation(a('q'))),
  ],
)

const solution = z.sRotLF(
  z.sRotRF(
    z.swl(
      o.p1.negation(o.p1.negation(a('p'))),
      z.swl(
        o.p1.negation(o.p1.negation(o.p1.negation(a('q')))),
        z.swr(
          o.p1.negation(o.p1.negation(a('q'))),
          z.swr(
            o.p1.negation(o.p1.negation(o.p1.negation(a('p')))),
            i.i(o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('q')))),
          ),
        ),
      ),
    ),
  ),
)

export const ch3negation8 = challenge({ rules, goal, solution })
