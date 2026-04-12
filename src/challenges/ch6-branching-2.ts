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
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'ir',
] as const

const pinned = ['dl', 'cr'] as const

const goal = sequent([a('p'), a('q')], [o.p2.conjunction(a('p'), a('q'))])

const solution = z.cr(
  z.swl(a('q'), i.i(a('p'))),
  z.sRotLF(z.swl(a('p'), i.i(a('q')))),
)

export const ch6branching2 = tutorial({ rules, goal, solution, pinned })
