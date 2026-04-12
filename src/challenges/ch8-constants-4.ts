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

const goal = sequent([a('s'), o.p0.falsum, a('s')], [a('r'), a('p'), a('r')])

const solution = z.sRotLF(
  z.swl(
    a('s'),
    z.swl(a('s'), z.swr(a('r'), z.swr(a('p'), z.swr(a('r'), i.f())))),
  ),
)

export const ch8constants4 = tutorial({ rules, goal, solution, pinned })
