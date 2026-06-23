import { equals, AnySequent } from '../../model/sequent'
import { AnyDerivation, ProofUsing } from '../../model/derivation'
import { bruteSearch } from '../../solver/brute'
import { challenges, isChallengeKey } from '../index'
import { RuleId } from '../../model/rule'
import { Configuration } from '../../model/challenge'
import { isReverseId1 } from '../../rules'

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

const countNodes = (d: AnyDerivation): number => {
  if (d.kind === 'premise') return 1
  return 1 + d.deps.reduce((s, c) => s + countNodes(c), 0)
}

describe('isChallengeKey', () => {
  it('accepts every registered challenge key', () => {
    for (const key of Object.keys(challenges)) {
      expect(isChallengeKey(key)).toBe(true)
    }
  })

  it('rejects keys that are not registered challenges', () => {
    expect(isChallengeKey('not-a-challenge')).toBe(false)
    expect(isChallengeKey('')).toBe(false)
    expect(isChallengeKey('ch99nonexistent')).toBe(false)
  })

  it('rejects inherited Object.prototype keys', () => {
    expect(isChallengeKey('toString')).toBe(false)
    expect(isChallengeKey('constructor')).toBe(false)
    expect(isChallengeKey('hasOwnProperty')).toBe(false)
  })
})

describe('challenges', () => {
  describe.each(Object.entries(challenges))(
    '%s challenge',
    (_name, { goal, rules, solution }) => {
      it('solution concludes goal', () => {
        expect(equals(solution.result, goal)).toBe(true)
      })
      it('solution is optimal', async () => {
        const solverRules = rules.filter((r) => !isReverseId1(r))
        const [optimal] = await brutePromise({ goal, rules: solverRules })
        expect(countNodes(optimal) >= countNodes(solution)).toBe(true)
      }, 2000)
    },
  )
})
