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
  refineActiveR,
  sequent,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type NRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Negation<A>, ...Δ]>
export type AnyNRResult = NRResult<Formulas, Prop, Formulas>
export const isNRResult: Refinement<AnySequent, AnyNRResult> =
  refineActiveR(isNegation)
export const isNRResultDerivation = refineDerivation(isNRResult)
export type NR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A], Δ>>], 'nr'>
export type AnyNR = NR<Formulas, Prop, Formulas, AnyNRResult>
export const nr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>],
): NR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'nr')
}
export type ApplyNR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? NR<Γ, A, Δ, NRResult<Γ, A, Δ>>
    : never

export const applyNR = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): ApplyNR<Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = tuple.init(s.result.antecedent)
  const a: A = tuple.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return nr(sequent(γ, [negation(a), ...δ]), [s])
}
export const reverseNR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const na: Negation<A> = tuple.head(p.result.succedent)
  const a: A = na.negand
  const δ: Δ = tuple.tail(p.result.succedent)
  return nr(p.result, [premise(sequent([...γ, a], δ))])
}
export const tryReverseNR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isNRResultDerivation(d) ? reverseNR(d) : null
}
export const exampleNR = applyNR(
  premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
)

export const ruleNR = {
  isResult: isNRResult,
  isResultDerivation: isNRResultDerivation,
  make: nr,
  apply: applyNR,
  reverse: reverseNR,
  tryReverse: tryReverseNR,
  example: exampleNR,
} satisfies Rule<AnyNRResult>
