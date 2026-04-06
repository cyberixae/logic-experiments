import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const rules = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.implication(a('p'), a('r')),
    o.p2.implication(
      o.p2.implication(a('q'), a('r')),
      o.p2.implication(o.p2.disjunction(a('p'), a('q')), a('r')),
    ),
  ),
)

const solution = z.ir(
  z.ir(
    z.ir(
      z.dl(
        z.sRotLF(
          z.il(
            z.sRotLF(
              z.sRotRF(
                z.swl(
                  o.p2.implication(a('q'), a('r')),
                  z.swr(a('r'), i.i(a('p'))),
                ),
              ),
            ),
            z.sRotLB(
              z.swl(
                a('p'),
                z.swl(o.p2.implication(a('q'), a('r')), i.i(a('r'))),
              ),
            ),
          ),
        ),
        z.sRotLB(
          z.il(
            z.sRotRF(
              z.swl(
                o.p2.implication(a('p'), a('r')),
                z.swr(a('r'), i.i(a('q'))),
              ),
            ),
            z.sRotLB(
              z.swl(
                o.p2.implication(a('p'), a('r')),
                z.swl(a('q'), i.i(a('r'))),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
)

export const ch9consolidation6 = challenge({ rules, goal, solution })
