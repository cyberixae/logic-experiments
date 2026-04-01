import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, Negation, isNegation, negation, atom } from '../model/prop'
import { Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type NLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Negation<A>], Δ>
export type AnyNLResult = NLResult<Formulas, Prop, Formulas>
export const isNLResult: Refinement<AnySequent, AnyNLResult> =
  refineActiveL(isNegation)
export const isNLResultDerivation = refineDerivation(isNLResult)
export type NLDeps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<Γ, [A, ...Δ]>>,
]
export type AnyNLDeps = NLDeps<Formulas, Prop, Formulas>
export type NL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
  D extends NLDeps<Γ, A, Δ>,
> = Transformation<R, D, 'nl'>
export type AnyNL = NL<Formulas, Prop, Formulas, AnyNLResult, AnyNLDeps>
export const nl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
  D extends NLDeps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): NL<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'nl')
}
export const applyNL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  D extends NLDeps<Γ, A, Δ>,
>(
  ...deps: D & NLDeps<Γ, A, Δ>
): NL<Γ, A, Δ, NLResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const a: A = tuple.head(dep.result.succedent)
  const δ: Δ = tuple.tail(dep.result.succedent)
  return nl(sequent([...γ, negation(a)], δ), deps)
}
export const reverseNL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NL<Γ, A, Δ, R, NLDeps<Γ, A, Δ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const na: Negation<A> = tuple.last(p.result.antecedent)
  const a: A = na.negand
  const δ: Δ = p.result.succedent
  return nl(p.result, [premise(sequent(γ, [a, ...δ]))])
}
export const tryReverseNL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isNLResultDerivation(d) ? reverseNL(d) : null
}
export const exampleNL = applyNL(
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
)

export const ruleNL = {
  id: 'nl',
  isResult: isNLResult,
  isResultDerivation: isNLResultDerivation,
  make: nl,
  apply: applyNL,
  reverse: reverseNL,
  tryReverse: tryReverseNL,
  example: exampleNL,
} satisfies Rule<AnyNLResult>
