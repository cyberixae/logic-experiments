import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const goal = sequent([a('s'), o.p0.falsum, a('s')], [a('r'), a('p'), a('r')])

const solution = z.sRotLF(
  z.swl(
    a('s'),
    z.swl(a('s'), z.swr(a('r'), z.swr(a('p'), z.swr(a('r'), i.f())))),
  ),
)

export const ch8constants4 = challenge({ rules, goal, solution })
