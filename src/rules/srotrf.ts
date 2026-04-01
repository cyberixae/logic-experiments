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

export type SRotRFResult<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
> = Sequent<Γ, [B, ...Δ, A]>
export type AnySRotRFResult = SRotRFResult<Formulas, Prop, Formulas, Prop>
export const isSRotRFResult: Refinement<AnySequent, AnySRotRFResult> = (
  s,
): s is AnySRotRFResult => {
  return s.succedent.length > 1
}
export const isSRotRFResultDerivation = refineDerivation(isSRotRFResult)
export type SRotRFDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<Γ, [A, B, ...Δ]>>]
export type AnySRotRFDeps = SRotRFDeps<Formulas, Prop, Prop, Formulas>
export type SRotRF<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
  D extends SRotRFDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'sRotRF'>
export type AnySRotRF = SRotRF<
  Formulas,
  Prop,
  Formulas,
  Prop,
  AnySRotRFResult,
  AnySRotRFDeps
>
export const sRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
  D extends SRotRFDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): SRotRF<Γ, B, Δ, A, R, D> => {
  return transformation(result, deps, 'sRotRF')
}
export const applySRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  D extends SRotRFDeps<Γ, A, B, Δ>,
>(
  ...deps: D & SRotRFDeps<Γ, A, B, Δ>
): SRotRF<Γ, B, Δ, A, SRotRFResult<Γ, B, Δ, A>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ: Δ = tuple.tail(tuple.tail(dep.result.succedent))
  const a: A = tuple.head(dep.result.succedent)
  const b: B = tuple.head(tuple.tail(dep.result.succedent))
  return sRotRF(sequent(γ, [b, ...δ, a]), deps)
}
export const reverseSRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
>(
  p: Derivation<R>,
): SRotRF<Γ, B, Δ, A, R, SRotRFDeps<Γ, A, B, Δ>> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = tuple.init(tuple.tail(p.result.succedent))
  const a: A = tuple.last(p.result.succedent)
  const b: B = tuple.head(p.result.succedent)
  return sRotRF(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseSRotRF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotRFResultDerivation(d) ? reverseSRotRF(d) : null
}
export const exampleSRotRF = applySRotRF(
  premise(sequent([atom('Γ')], [atom('A'), atom('B'), atom('Δ')])),
)

export const ruleSRotRF = {
  id: 'sRotRF',
  isResult: isSRotRFResult,
  isResultDerivation: isSRotRFResultDerivation,
  make: sRotRF,
  apply: applySRotRF,
  reverse: reverseSRotRF,
  tryReverse: tryReverseSRotRF,
  example: exampleSRotRF,
} satisfies Rule<AnySRotRFResult>
