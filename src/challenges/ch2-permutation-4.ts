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

const goal = sequent(
  [a('s'), a('r'), a('q'), a('p')],
  [a('s'), a('r'), a('q'), a('p')],
)

const solution = z.sRotRF(
  z.sRotRF(
    z.sRotRF(
      z.swl(
        a('p'),
        z.swl(
          a('q'),
          z.swl(
            a('r'),
            z.swr(a('r'), z.swr(a('q'), z.swr(a('p'), i.i(a('s'))))),
          ),
        ),
      ),
    ),
  ),
)

export const ch2permutation4 = challenge({ rules, goal, solution })
