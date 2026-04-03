import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'dl',
  'cr',
] as const

const goal = sequent([a('p'), a('q')], [o.p2.conjunction(a('p'), a('q'))])

const solution = z.cr(
  z.swl(a('q'), i.i(a('p'))),
  z.sRotLF(z.swl(a('p'), i.i(a('q')))),
)

export const ch6branching2 = challenge({ rules, goal, solution })
