import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = rk

const goal = sequent([a('p'), a('p'), a('p'), a('q'), a('p'), a('p')], [a('q')])

const solution = z.swl(
  a('p'),
  z.swl(
    a('p'),
    z.sRotLB(z.swl(a('p'), z.swl(a('p'), z.swl(a('p'), i.i(a('q')))))),
  ),
)

export const ch2permutation1 = challenge({ rules, goal, solution })
