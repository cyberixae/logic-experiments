import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent([a('s'), a('p'), a('s')], [a('r'), o.p0.verum, a('r')])

const solution = z.sRotRF(
  z.swl(
    a('s'),
    z.swl(a('p'), z.swl(a('s'), z.swr(a('r'), z.swr(a('r'), i.v())))),
  ),
)

export const ch8constants3 = challenge({ rules, goal, solution })
