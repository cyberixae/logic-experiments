import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

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

const pinned = ['f', 'v'] as const

const goal = sequent([a('p'), o.p0.verum, a('q')], [a('q'), o.p0.verum, a('p')])

const solution = z.sRotRF(
  z.swl(
    a('q'),
    z.swl(o.p0.verum, z.swl(a('p'), z.swr(a('p'), z.swr(a('q'), i.v())))),
  ),
)

export const ch8constants3 = tutorial({ rules, goal, solution, pinned })
