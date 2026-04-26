import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(o.p2.implication(a('p'), a('q')), a('p')),
    a('p'),
  ),
)

const solution = z.ir(z.il(z.ir(z.swr(a('q'), i.i(a('p')))), i.i(a('p'))))

export const ch7completeness5 = challenge({ rules, goal, solution })
