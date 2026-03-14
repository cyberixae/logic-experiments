import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type SXRResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [B, A, ...Δ]>
export type AnySXRResult = SXRResult<Formulas, Prop, Prop, Formulas>
export const isSXRResult: Refinement<AnySequent, AnySXRResult> = (
  s,
): s is AnySXRResult => {
  return s.succedent.length > 1
}
export const isSXRResultDerivation = refineDerivation(isSXRResult)
export type SXR<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'sxr'>
export type AnySXR = SXR<Formulas, Prop, Prop, Formulas, AnySXRResult>
export const sxr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): SXR<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sxr')
}
export type ApplySXR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SXR<Γ, B, A, Δ, SXRResult<Γ, B, A, Δ>>
    : never
export const applySXR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplySXR<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const b: B = tuple.head(tuple.tail(s.result.succedent))
  const a: A = tuple.head(s.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  return sxr(sequent(γ, [b, a, ...δ]), [s])
}
export const reverseSXR = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SXR<Γ, B, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const a: A = tuple.head(tuple.tail(p.result.succedent))
  const b: B = tuple.head(p.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(p.result.succedent))
  return sxr(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseSXR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSXRResultDerivation(d) ? reverseSXR(d) : null
}
export const exampleSXR = applySXR(
  premise(sequent([atom('Γ')], [atom('A'), atom('B'), atom('Δ')])),
)

export const ruleSXR = {
  isResult: isSXRResult,
  isResultDerivation: isSXRResultDerivation,
  make: sxr,
  apply: applySXR,
  reverse: reverseSXR,
  tryReverse: tryReverseSXR,
  example: exampleSXR,
} satisfies Rule<AnySXRResult>
