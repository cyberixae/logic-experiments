import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import { Prop, Negation, isNegation, negation, atom } from '../model/prop'
import {
  Formulas,
  Sequent,
  AnySequent,
  refineActiveL,
  sequent,
} from '../model/sequent'
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
export type NL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, ...Δ]>>], 'nl'>
export type AnyNL = NL<Formulas, Prop, Formulas, AnyNLResult>
export const nl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>],
): NL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'nl')
}
export type ApplyNL<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? NL<Γ, A, Δ, NLResult<Γ, A, Δ>>
    : never
export const applyNL = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplyNL<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = tuple.head(s.result.succedent)
  const δ: Δ = tuple.tail(s.result.succedent)
  return nl(sequent([...γ, negation(a)], δ), [s])
}
export const reverseNL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NL<Γ, A, Δ, R> => {
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
  isResult: isNLResult,
  isResultDerivation: isNLResultDerivation,
  make: nl,
  apply: applyNL,
  reverse: reverseNL,
  tryReverse: tryReverseNL,
  example: exampleNL,
} satisfies Rule<AnyNLResult>
