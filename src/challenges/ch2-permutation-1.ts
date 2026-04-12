import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, z, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const pinned = ['sRotLF', 'sRotRF', 'sRotLB', 'sRotRB'] as const

const goal = sequent([a('p'), a('p'), a('p'), a('q'), a('p'), a('p')], [a('q')])

const solution = z.swl(
  a('p'),
  z.swl(
    a('p'),
    z.sRotLB(z.swl(a('p'), z.swl(a('p'), z.swl(a('p'), i.i(a('q')))))),
  ),
)

export const ch2permutation1 = tutorial({ rules, goal, solution, pinned })
