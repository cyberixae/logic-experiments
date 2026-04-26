import { rk, rules } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = conclusion(
  o.p2.implication(a('r'), o.p2.implication(a('q'), a('q'))),
)

const solution = z.ir(z.ir(z.sRotLF(z.swl(a('r'), i.i(a('q'))))))

export const ch4theorem6 = challenge({ rules, goal, solution })
