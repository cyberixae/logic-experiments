import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
)

const solution = z.ir(z.ir(z.swl(a('r'), i.i(a('q')))))

export const ch4theorem5 = challenge({ rules, goal, solution })
