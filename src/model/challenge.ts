import { brute } from '../solver/brute'
import * as seq from '../utils/seq'
import { repeatIO } from '../utils/seq'
import { Proof } from './derivation'
import * as prop from './prop'
import { RuleId } from './rule'
import { AnySequent, conclusion } from './sequent'

export type Configuration<J extends AnySequent> = {
  goal: J
  rules: Array<RuleId>
}
export interface Challenge<J extends AnySequent> extends Configuration<J> {
  solution: Proof<J>
}

export const random =
  (size: number = 10, minDifficulty: number = 8) =>
  (): Challenge<AnySequent> => {
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
