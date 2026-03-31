import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/Formulas'
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
export type SRotRF<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'sRotRF'>
export type AnySRotRF = SRotRF<Formulas, Prop, Formulas, Prop, AnySRotRFResult>
export const sRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): SRotRF<Γ, B, Δ, A, R> => {
  return transformation(result, deps, 'sRotRF')
}
export type ApplySRotRF<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SRotRF<Γ, B, Δ, A, SRotRFResult<Γ, B, Δ, A>>
    : never
export const applySRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplySRotRF<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  const a: A = tuple.head(s.result.succedent)
  const b: B = tuple.head(tuple.tail(s.result.succedent))
  return sRotRF(sequent(γ, [b, ...δ, a]), [s])
}
export const reverseSRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
>(
  p: Derivation<R>,
): SRotRF<Γ, B, Δ, A, R> => {
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
