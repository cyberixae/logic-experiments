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
  'cl',
  'cr',
  'dl',
  'dr',
] as const

const goal = sequent(
  [o.p2.conjunction(a('p'), a('q'))],
  [o.p2.conjunction(a('q'), a('p'))],
)

const solution = z.cl(
  z.cr(z.sRotLF(z.swl(a('p'), i.i(a('q')))), z.swl(a('q'), i.i(a('p')))),
)

export const ch6branching5 = challenge({ rules, goal, solution })
