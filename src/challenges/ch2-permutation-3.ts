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
  [a('p'), a('p'), a('p'), a('q'), a('p'), a('p')],
  [a('p'), a('p'), a('p'), a('q'), a('p'), a('p')],
)

const solution = z.swl(
  a('p'),
  z.swl(
    a('p'),
    z.swl(
      a('q'),
      z.swl(
        a('p'),
        z.swl(
          a('p'),
          z.swr(
            a('p'),
            z.swr(
              a('p'),
              z.swr(a('p'), z.swr(a('q'), z.swr(a('p'), i.i(a('p'))))),
            ),
          ),
        ),
      ),
    ),
  ),
)
export const ch2permutation3 = challenge({ rules, goal, solution })
