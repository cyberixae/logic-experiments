import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const pinned = ['f', 'v'] as const

const goal = sequent(
  [o.p2.disjunction(o.p0.falsum, a('p'))],
  [o.p2.conjunction(o.p0.verum, a('p'))],
)

const solution = z.dl(
  z.swr(o.p2.conjunction(o.p0.verum, a('p')), i.f()),
  z.cr(z.swl(a('p'), i.v()), i.i(a('p'))),
)

export const ch8constants7 = tutorial({ rules, goal, solution, pinned })
