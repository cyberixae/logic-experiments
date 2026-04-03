import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
] as const

const goal = sequent(
  [o.p2.disjunction(o.p0.falsum, a('p'))],
  [o.p2.conjunction(o.p0.verum, a('p'))],
)

const solution = z.dl(
  z.swr(o.p2.conjunction(o.p0.verum, a('p')), i.f()),
  z.cr(z.swl(a('p'), i.v()), i.i(a('p'))),
)

export const ch8constants7 = challenge({ rules, goal, solution })
