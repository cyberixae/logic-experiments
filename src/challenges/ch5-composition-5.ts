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
  'dr',
] as const

const goal = sequent(
  [
    o.p2.conjunction(
      o.p2.conjunction(a('r'), a('p')),
      o.p2.disjunction(a('p'), a('r')),
    ),
  ],

  [
    o.p2.disjunction(
      o.p2.conjunction(a('p'), a('r')),
      o.p2.disjunction(a('r'), a('p')),
    ),
  ],
)

const solution = z.cl(
  z.dr(
    z.sRotRF(
      z.dr(
        z.sRotLF(
          z.cl(
            z.sRotLF(
              z.sRotRF(
                z.sRotRF(
                  z.swl(
                    o.p2.disjunction(a('p'), a('r')),
                    z.swl(
                      a('p'),
                      // @ts-expect-error TODO: fix type error
                      z.swr(
                        a('p'),
                        z.swr(o.p2.conjunction(a('p'), a('r')), i.i(a('r'))),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch5composition5 = challenge({ rules, goal, solution })
