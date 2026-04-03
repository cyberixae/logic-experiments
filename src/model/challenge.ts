import { brute } from '../solver/brute'
import * as seq from '../utils/seq'
import { repeatIO } from '../utils/seq'
import { Proof } from './derivation'
import * as prop from './prop'
import { RuleId } from './rule'
import { AnySequent, conclusion } from './sequent'

export type Configuration<
  J extends AnySequent,
  S extends ReadonlyArray<RuleId> = ReadonlyArray<RuleId>,
> = {
  goal: J
  rules: S
}
export const configuration = <
  J extends AnySequent,
  const S extends ReadonlyArray<RuleId>,
>(
  c: Configuration<J, S>,
) => c

export interface Challenge<
  J extends AnySequent,
  S extends ReadonlyArray<RuleId>,
> extends Configuration<J, S> {
  solution: Proof<NoInfer<J>>
}
export type AnyChallenge = Challenge<AnySequent, ReadonlyArray<RuleId>>
export const challenge = <
  J extends AnySequent,
  const S extends ReadonlyArray<RuleId>,
>(
  c: Challenge<J, S>,
) => c

export const random =
  (size: number = 10, minDifficulty: number = 8) =>
  (): AnyChallenge => {
    let solution
    while (!solution) {
      ;[solution] = seq.head(
        seq.flatMap(
          seq.filter(repeatIO(prop.random(size)), prop.isTautology),
          (tautology) => {
            const [proof, difficulty] = brute(conclusion(tautology))
            return difficulty < minDifficulty ? seq.empty() : seq.of(proof)
          },
        ),
      )
    }
    return {
      rules: [
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
      ],
      goal: solution.result,
      solution,
    }
  }
