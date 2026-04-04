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
  [a('p'), o.p1.negation(a('p')), a('q'), a('r')],
  [o.p1.negation(a('q')), o.p1.negation(a('p')), a('s'), o.p1.negation(a('r'))],
)

const solution = z.swr(
  o.p1.negation(a('q')),
  z.sRotLF(
    z.sRotRB(
      z.swl(
        a('p'),
        z.swl(
          a('r'),
          z.swl(
            a('q'),
            z.swr(
              a('s'),
              z.swr(o.p1.negation(a('r')), i.i(o.p1.negation(a('p')))),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch2permutation9 = challenge({ rules, goal, solution })
