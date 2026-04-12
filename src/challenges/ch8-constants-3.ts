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

const goal = sequent([a('s'), a('p'), a('s')], [a('r'), o.p0.verum, a('r')])

const solution = z.sRotRF(
  z.swl(
    a('q'),
    z.swl(o.p0.verum, z.swl(a('p'), z.swr(a('p'), z.swr(a('q'), i.v())))),
  ),
)

export const ch8constants3 = tutorial({ rules, goal, solution, pinned })
