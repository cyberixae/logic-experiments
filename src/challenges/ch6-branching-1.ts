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

const goal = sequent([o.p2.disjunction(a('p'), a('q'))], [a('p'), a('q')])

const solution = z.dl(
  z.sRotRF(z.swr(a('q'), i.i(a('p')))),
  z.swr(a('p'), i.i(a('q'))),
)

export const ch6branching1 = challenge({ rules, goal, solution })
