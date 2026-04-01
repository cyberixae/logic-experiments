import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
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
export type SXRDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<Γ, [A, B, ...Δ]>>]
export type AnySXRDeps = SXRDeps<Formulas, Prop, Prop, Formulas>
export type SXR<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
  D extends SXRDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'sxr'>
export type AnySXR = SXR<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnySXRResult,
  AnySXRDeps
>
export const sxr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
  D extends SXRDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): SXR<Γ, B, A, Δ, R, D> => {
  return transformation(result, deps, 'sxr')
}
export const applySXR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends SXRDeps<Γ, A, B, Δ>,
>(
  ...deps: D & SXRDeps<Γ, A, B, Δ>
): SXR<Γ, B, A, Δ, SXRResult<Γ, B, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const b: B = tuple.head(tuple.tail(dep.result.succedent))
  const a: A = tuple.head(dep.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(dep.result.succedent))
  return sxr(sequent(γ, [b, a, ...δ]), deps)
}
export const reverseSXR = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SXR<Γ, B, A, Δ, R, SXRDeps<Γ, A, B, Δ>> => {
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
  id: 'sxr',
  isResult: isSXRResult,
  isResultDerivation: isSXRResultDerivation,
  make: sxr,
  apply: applySXR,
  reverse: reverseSXR,
  tryReverse: tryReverseSXR,
  example: exampleSXR,
} satisfies Rule<AnySXRResult>
