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

export type DR2Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Disjunction<A, B>, ...Δ]>
export type AnyDR2Result = DR2Result<Formulas, Prop, Prop, Formulas>
export const isDR2Result: Refinement<AnySequent, AnyDR2Result> = (
  s,
): s is AnyDR2Result => {
  return s.succedent.at(0)?.kind === 'disjunction'
}
export const isDR2ResultDerivation = refineDerivation(isDR2Result)
export type DR2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [B, ...Δ]>>], 'dr2'>
export type AnyDR2 = DR2<Formulas, Prop, Prop, Formulas, AnyDR2Result>
export const dr2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [B, ...Δ]>>],
): DR2<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dr2')
}
export type ApplyDR2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer B extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR2<Γ, A, B, Δ, DR2Result<Γ, A, B, Δ>>
    : never
export const applyDR2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, [B, ...Δ]>>,
): ApplyDR2<A, Derivation<Sequent<Γ, [B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.tail(s.result.succedent)
  const b: B = tuple.head(s.result.succedent)
  return dr2(sequent(γ, [disjunction(a, b), ...δ]), [s])
}
export const reverseDR2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR2<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const adb: Disjunction<A, B> = tuple.head(p.result.succedent)
  const b: B = adb.rightDisjunct
  const δ: Δ = tuple.tail(p.result.succedent)
  return dr2(p.result, [premise(sequent(γ, [b, ...δ]))])
}
export const tryReverseDR2 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDR2ResultDerivation(d) ? reverseDR2(d) : null
}
export const exampleDR2 = applyDR2(
  atom('A'),
  premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
)

export const ruleDR2 = {
  id: 'dr2',
  isResult: isDR2Result,
  isResultDerivation: isDR2ResultDerivation,
  make: dr2,
  apply: applyDR2,
  reverse: reverseDR2,
  tryReverse: tryReverseDR2,
  example: exampleDR2,
} satisfies Rule<AnyDR2Result>
