import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
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
  'nl',
  'nr',
  'cl',
  'dr',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.conjunction(
      o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('s'))),
      o.p2.conjunction(o.p1.negation(a('p')), a('r')),
    ),
    o.p2.disjunction(
      o.p2.disjunction(a('q'), o.p1.negation(a('q'))),
      o.p2.disjunction(a('s'), o.p1.negation(a('r'))),
    ),
  ),
)

const solution = z.ir(
  z.dr(
    z.dr(
      z.sRotRB(
        z.nr(
          z.sRotLF(
            z.swl(
              o.p2.conjunction(
                o.p2.conjunction(o.p1.negation(a('p')), o.p1.negation(a('s'))),
                o.p2.conjunction(o.p1.negation(a('p')), a('r')),
              ),
              z.swr(
                o.p2.disjunction(a('s'), o.p1.negation(a('r'))),
                i.i(a('q')),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch5composition9 = challenge({ rules, goal, solution })
