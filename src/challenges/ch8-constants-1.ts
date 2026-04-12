import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

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

const pinned = ['i'] as const

const goal = sequent([a('p'), o.p0.verum, a('q')], [a('r'), o.p0.verum, a('s')])

const solution = z.sRotLF(
  z.sRotRF(
    z.swl(a('p'), z.swl(a('q'), z.swr(a('s'), z.swr(a('r'), i.i(o.p0.verum))))),
  ),
)

export const ch8constants1 = tutorial({ rules, goal, solution, pinned })
