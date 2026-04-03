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
] as const

const goal = sequent([a('p'), a('p'), a('p'), a('q'), a('p'), a('p')], [a('q')])

const solution = z.sRotLF(
  z.sRotLF(
    z.sRotLF(
      z.swl(
        a('p'),
        z.swl(a('p'), z.swl(a('p'), z.swl(a('p'), z.swl(a('p'), i.i(a('q')))))),
      ),
    ),
  ),
)

export const ch2permutation1 = challenge({ rules, goal, solution })
