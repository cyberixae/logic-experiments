import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.conjunction(
      o.p2.implication(a('p'), a('q')),

      o.p2.disjunction(o.p1.negation(a('q')), a('r')),
    ),
    o.p2.disjunction(o.p1.negation(a('p')), a('r')),
  ),
)

const solution = z.ir(
  z.cl(
    z.sRotLF(
      z.il(
        z.sRotRF(
          z.dr(
            z.nr(
              z.sRotLF(
                z.swl(
                  o.p2.disjunction(o.p1.negation(a('q')), a('r')),
                  z.swr(a('r'), i.i(a('p'))),
                ),
              ),
            ),
          ),
        ),
        z.sRotLF(
          z.dl(
            z.nl(
              z.sRotRF(
                z.swr(
                  o.p2.disjunction(o.p1.negation(a('p')), a('r')),
                  i.i(a('q')),
                ),
              ),
            ),
            z.dr(
              z.sRotLF(
                z.swl(a('q'), z.swr(o.p1.negation(a('p')), i.i(a('r')))),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation3 = challenge({ rules, goal, solution })
