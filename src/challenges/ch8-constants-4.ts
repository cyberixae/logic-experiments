import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const goal = sequent(
  [a('r'), o.p0.falsum, a('s')],
  [a('s'), o.p0.falsum, a('r')],
)

const solution = z.sRotLF(
  z.swl(
    a('r'),
    z.swl(a('s'), z.swr(a('s'), z.swr(o.p0.falsum, z.swr(a('r'), i.f())))),
  ),
)

export const ch8constants4 = challenge({ rules, goal, solution })
