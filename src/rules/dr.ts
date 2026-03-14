import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import { Prop, Disjunction, disjunction, atom } from '../model/prop'
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type DRResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Disjunction<A, B>, ...Δ]>
export type AnyDRResult = DRResult<Formulas, Prop, Prop, Formulas>
export const isDRResult: Refinement<AnySequent, AnyDRResult> = (
  s,
): s is AnyDRResult => {
  return s.succedent.at(0)?.kind === 'disjunction'
}
export const isDRResultDerivation = refineDerivation(isDRResult)
export type DR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'dr'>
export type AnyDR = DR<Formulas, Prop, Prop, Formulas, AnyDRResult>
export const dr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): DR<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dr')
}
export type ApplyDR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? DR<Γ, A, B, Δ, DRResult<Γ, A, B, Δ>>
    : never
export const applyDR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplyDR<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = tuple.head(s.result.succedent)
  const b: B = tuple.head(tuple.tail(s.result.succedent))
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  return dr(sequent(γ, [disjunction(a, b), ...δ]), [s])
}
export const reverseDR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const adb: Disjunction<A, B> = tuple.head(p.result.succedent)
  const a: A = adb.leftDisjunct
  const b: B = adb.rightDisjunct
  const δ: Δ = tuple.tail(p.result.succedent)
  return dr(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseDR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDRResultDerivation(d) ? reverseDR(d) : null
}
export const exampleDR = applyDR(
  premise(sequent([atom('Γ')], [atom('A'), atom('B'), atom('Δ')])),
)

export const ruleDR = {
  isResult: isDRResult,
  isResultDerivation: isDRResultDerivation,
  make: dr,
  apply: applyDR,
  reverse: reverseDR,
  tryReverse: tryReverseDR,
  example: exampleDR,
} satisfies Rule<AnyDRResult>
