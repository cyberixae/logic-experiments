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
      o.p2.conjunction(a('p'), a('q')),
      o.p2.implication(a('r'), a('q')),
    ),
  ],
  [
    o.p2.disjunction(
      o.p2.implication(a('q'), a('r')),
      o.p2.disjunction(a('p'), a('q')),
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
                    o.p2.implication(a('r'), a('q')),
                    z.swl(
                      a('q'),
                      z.swr(
                        a('q'),
                        z.swr(o.p2.implication(a('q'), a('r')), i.i(a('p'))),
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

export const ch5composition7 = challenge({ rules, goal, solution })
