import { equals, AnySequent, conclusion } from '../../model/sequent'
import { equalsDerivation, ProofUsing } from '../../model/derivation'
import { bruteSearch } from '../../solver/brute'
import { RuleId } from '../../model/rule'
import { Configuration, challenge } from '../../model/challenge'
import { la3 } from '../la3'

const { a, o, i, z } = la3

const brutePromise = async <S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
): Promise<[ProofUsing<S, R>, number]> => {
  const gen = bruteSearch(c)
  while (true) {
    const { done, value } = gen.next()
    if (done === true) return value
    await new Promise<void>((resolve) => queueMicrotask(resolve))
  }
}

const challenges = {
  a1: challenge({
    rules: ['a1'] as const,
    goal: conclusion(
      o.p2.implication(a('p'), o.p2.implication(a('q'), a('p'))),
    ),
    solution: i.a1(a('p'), a('q')),
  }),
  a2: challenge({
    rules: ['a2'] as const,
    goal: conclusion(
      o.p2.implication(
        o.p2.implication(a('p'), o.p2.implication(a('q'), a('r'))),
        o.p2.implication(
          o.p2.implication(a('p'), a('q')),
          o.p2.implication(a('p'), a('r')),
        ),
      ),
    ),
    solution: i.a2(a('p'), a('q'), a('r')),
  }),
  a3: challenge({
    rules: ['a3'] as const,
    goal: conclusion(
      o.p2.implication(
        o.p2.implication(o.p1.negation(a('p')), o.p1.negation(a('q'))),
        o.p2.implication(a('q'), a('p')),
      ),
    ),
    solution: i.a3(a('p'), a('q')),
  }),
  mp: challenge({
    rules: ['a1', 'a2', 'mp'] as const,
    goal: conclusion(
      o.p2.implication(
        o.p2.implication(
          a('p'),
          o.p2.implication(a('q'), o.p1.negation(a('p'))),
        ),
        o.p2.implication(a('p'), a('p')),
      ),
    ),
    solution: z.mp(
      i.a2(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p'))), a('p')),
      i.a1(a('p'), o.p2.implication(a('q'), o.p1.negation(a('p')))),
    ),
  }),
}

describe('la3 challenges', () => {
  describe.each(Object.entries(challenges))(
    '%s',
    (_name, { goal, rules, solution }) => {
      it('solution concludes goal', () => {
        expect(equals(solution.result, goal)).toBe(true)
      })
      it('solution is optimal', async () => {
        const [optimal] = await brutePromise({ goal, rules })
        expect(equalsDerivation(solution, optimal)).toBe(true)
      }, 2000)
    },
  )
})
