import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const goal = sequent(
  [a('s'), o.p0.falsum, a('r')],
  [a('q'), o.p0.falsum, a('p')],
)

const solution = z.sRotLF(
  z.sRotRF(
    z.swl(
      a('s'),
      z.swl(a('r'), z.swr(a('p'), z.swr(a('q'), i.i(o.p0.falsum)))),
    ),
  ),
)

export const ch8constants2 = challenge({ rules, goal, solution })
