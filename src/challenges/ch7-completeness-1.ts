import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent([a('p'), o.p2.implication(a('p'), a('q'))], [a('q')])

const solution = z.il(
  z.sRotRF(z.swr(a('q'), i.i(a('p')))),
  z.sRotLF(z.swl(a('p'), i.i(a('q')))),
)

export const ch7completeness1 = challenge({ rules, goal, solution })
