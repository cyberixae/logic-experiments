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

export type SRotRBResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, B, ...Δ]>
export type AnySRotRBResult = SRotRBResult<Formulas, Prop, Prop, Formulas>
export const isSRotRBResult: Refinement<AnySequent, AnySRotRBResult> = (
  s,
): s is AnySRotRBResult => {
  return s.succedent.length > 1
}
export const isSRotRBResultDerivation = refineDerivation(isSRotRBResult)
export type SRotRB<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [B, ...Δ, A]>>], 'sRotRB'>
export type AnySRotRB = SRotRB<Formulas, Prop, Prop, Formulas, AnySRotRBResult>
export const sRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [B, ...Δ, A]>>],
): SRotRB<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'sRotRB')
}
export type ApplySRotRB<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer B extends Prop, ...infer Δ extends Formulas, infer A extends Prop]
    >
  >
    ? SRotRB<Γ, A, B, Δ, SRotRBResult<Γ, A, B, Δ>>
    : never
export const applySRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [B, ...Δ, A]>>,
): ApplySRotRB<Derivation<Sequent<Γ, [B, ...Δ, A]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.init(tuple.tail(s.result.succedent))
  const a: A = tuple.last(s.result.succedent)
  const b: B = tuple.head(s.result.succedent)
  return sRotRB(sequent(γ, [a, b, ...δ]), [s])
}
export const reverseSRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): SRotRB<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = tuple.tail(tuple.tail(p.result.succedent))
  const a: A = tuple.head(p.result.succedent)
  const b: B = tuple.head(tuple.tail(p.result.succedent))
  return sRotRB(p.result, [premise(sequent(γ, [b, ...δ, a]))])
}
export const tryReverseSRotRB = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotRBResultDerivation(d) ? reverseSRotRB(d) : null
}
export const exampleSRotRB = applySRotRB(
  premise(sequent([atom('Γ')], [atom('B'), atom('Δ'), atom('A')])),
)

export const ruleSRotRB = {
  id: 'sRotRB',
  isResult: isSRotRBResult,
  isResultDerivation: isSRotRBResultDerivation,
  make: sRotRB,
  apply: applySRotRB,
  reverse: reverseSRotRB,
  tryReverse: tryReverseSRotRB,
  example: exampleSRotRB,
} satisfies Rule<AnySRotRBResult>
