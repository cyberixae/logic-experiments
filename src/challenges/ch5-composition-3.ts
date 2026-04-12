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
  'dr',
  'ir',
] as const

const pinned = ['cl', 'dr'] as const

const goal = sequent(
  [o.p2.conjunction(a('q'), a('p'))],
  [o.p2.disjunction(a('p'), a('q'))],
)

const solution = z.cl(z.dr(z.swl(a('p'), z.swr(a('p'), i.i(a('q'))))))

export const ch5composition3 = tutorial({ rules, goal, solution, pinned })
