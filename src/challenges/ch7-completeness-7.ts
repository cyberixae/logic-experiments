import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), o.p2.implication(a('p'), a('q'))),
    o.p2.implication(a('p'), a('q')),
  ),
)

const solution = z.ir(
  z.il(
    z.sRotRF(z.ir(z.swr(a('q'), i.i(a('p'))))),
    i.i(o.p2.implication(a('p'), a('q'))),
  ),
)

export const ch7completeness7 = challenge({ rules, goal, solution })
