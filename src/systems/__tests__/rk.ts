import { equals, AnySequent, conclusion, sequent } from '../../model/sequent'
import { equalsDerivation, ProofUsing } from '../../model/derivation'
import { bruteSearch } from '../../solver/brute'
import { RuleId } from '../../model/rule'
import { Configuration, challenge } from '../../model/challenge'
import { rk } from '../rk'

const { a, o, i, z } = rk

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
  weakenAndImply: challenge({
    rules: ['i', 'ir', 'swl'] as const,
    goal: conclusion(
      o.p2.implication(
        o.p2.implication(
          a('p'),
          o.p2.implication(a('q'), o.p1.negation(a('p'))),
        ),
        o.p2.implication(a('p'), a('p')),
      ),
    ),
    solution: z.ir(
      z.swl(
        o.p2.implication(
          a('p'),
          o.p2.implication(a('q'), o.p1.negation(a('p'))),
        ),
        z.ir(i.i(a('p'))),
      ),
    ),
  }),
}

describe('rk challenges', () => {
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
