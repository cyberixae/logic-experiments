import { equals, conclusion, sequent } from '../../model/sequent'
import { challenge } from '../../model/challenge'
import { fk } from '../fk'

const { a, o, i, z } = fk

const challenges = {
  identity: challenge({
    rules: ['i'] as const,
    goal: sequent([a('p')], [a('p')]),
    solution: i.i(a('p')),
  }),
  implicationRight: challenge({
    rules: ['i', 'ir'] as const,
    goal: conclusion(o.p2.implication(a('p'), a('p'))),
    solution: z.ir(i.i(a('p'))),
  }),
  conjunctionRight: challenge({
    rules: ['i', 'fcr'] as const,
    goal: sequent([a('p'), a('q')], [o.p2.conjunction(a('p'), a('q'))]),
    solution: z.fcr(i.i(a('p')), i.i(a('q'))),
  }),
  disjunctionLeft: challenge({
    rules: ['i', 'fdl'] as const,
    goal: sequent([o.p2.disjunction(a('p'), a('q'))], [a('p'), a('q')]),
    solution: z.fdl(i.i(a('p')), i.i(a('q'))),
  }),
}

describe('fk challenges', () => {
  describe.each(Object.entries(challenges))(
    '%s',
    (_name, { goal, solution }) => {
      it('solution concludes goal', () => {
        expect(equals(solution.result, goal)).toBe(true)
      })
    },
  )
})
