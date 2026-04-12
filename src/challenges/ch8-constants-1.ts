import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

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

const pinned = ['f', 'v'] as const

const goal = sequent([a('p'), o.p0.verum, a('q')], [a('r'), o.p0.verum, a('s')])

const solution = z.sRotRF(
  z.swl(
    a('q'),
    z.swl(o.p0.verum, z.swl(a('p'), z.swr(a('s'), z.swr(a('r'), i.v())))),
  ),
)

export const ch8constants1 = tutorial({ rules, goal, solution, pinned })
