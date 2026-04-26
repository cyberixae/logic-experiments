import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent(
  [
    o.p2.conjunction(
      o.p2.conjunction(a('r'), a('q')),
      o.p2.implication(a('s'), o.p1.negation(o.p0.verum)),
    ),
  ],
  [
    o.p2.disjunction(
      o.p2.implication(a('s'), o.p2.implication(a('q'), a('r'))),
      o.p0.falsum,
    ),
  ],
)

const solution = z.cl(
  z.dr(
    z.il(
      z.sRotRB(
        z.ir(
          z.sRotLF(
            z.swl(
              o.p2.conjunction(a('r'), a('q')),
              z.swr(
                o.p2.implication(a('q'), a('r')),
                z.swr(o.p0.falsum, i.i(a('s'))),
              ),
            ),
          ),
        ),
      ),
      z.nl(
        z.sRotRB(
          z.swl(
            o.p2.conjunction(a('r'), a('q')),
            z.swr(
              o.p2.implication(a('s'), o.p2.implication(a('q'), a('r'))),
              z.swr(o.p0.falsum, i.v()),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch8constants9 = challenge({ rules, goal, solution })
