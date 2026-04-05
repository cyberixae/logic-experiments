import { brute } from '../solver/brute'
import * as seq from '../utils/seq'
import { ProofUsing } from '../model/derivation'
import * as prop from '../model/prop'
import { RuleId } from '../model/rule'
import { AnySequent, conclusion } from '../model/sequent'
import { Challenge } from '../model/challenge'

export const random =
  (size: number = 10, minDifficulty: number = 8) =>
  (): Challenge<AnySequent, Array<RuleId>> => {
    const rules: Array<RuleId> = [
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
    ]
    let solution: ProofUsing<AnySequent, RuleId> | undefined
    while (typeof solution === 'undefined') {
      ;[solution] = seq.head(
        seq.flatMap(
          seq.filter(seq.repeatIO(prop.random(size)), prop.isTautology),
          (tautology) => {
            const [proof, difficulty] = brute({
              goal: conclusion(tautology),
              rules,
            })
            return difficulty < minDifficulty ? seq.empty() : seq.of(proof)
          },
        ),
      )
    }
    return {
      rules,
      goal: solution.result,
      solution,
    }
  }
