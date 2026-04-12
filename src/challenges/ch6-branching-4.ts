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
  'cl',
  'cr',
  'dl',
  'dr',
] as const

const pinned = ['dl', 'cr'] as const

const goal = sequent(
  [o.p2.disjunction(a('p'), a('q'))],
  [o.p2.disjunction(a('q'), a('p'))],
)

const solution = z.dr(
  z.dl(z.swr(a('q'), i.i(a('p'))), z.sRotRF(z.swr(a('p'), i.i(a('q'))))),
)

export const ch6branching4 = tutorial({ rules, goal, solution, pinned })
