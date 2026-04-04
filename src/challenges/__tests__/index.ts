import { equals, AnySequent } from '../../model/sequent'
import { equalsDerivation, ProofUsing } from '../../model/derivation'
import { bruteSearch } from '../../solver/brute'
import { challenges } from '../index'
import { RuleId } from '../../model/rule'
import { Configuration } from '../../model/challenge'

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

describe('challenges', () => {
  describe.each(Object.entries(challenges))(
    '%s challenge',
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
