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

export type DR1Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Disjunction<A, B>, ...Δ]>
export type AnyDR1Result = DR1Result<Formulas, Prop, Prop, Formulas>
export const isDR1Result: Refinement<AnySequent, AnyDR1Result> = (
  s,
): s is AnyDR1Result => {
  return s.succedent.at(0)?.kind === 'disjunction'
}
export const isDR1ResultDerivation = refineDerivation(isDR1Result)
export type DR1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, ...Δ]>>], 'dr1'>
export type AnyDR1 = DR1<Formulas, Prop, Prop, Formulas, AnyDR1Result>
export const dr1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>],
): DR1<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dr1')
}
export type ApplyDR1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR1<Γ, A, B, Δ, DR1Result<Γ, A, B, Δ>>
    : never
export const applyDR1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplyDR1<B, Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.tail(s.result.succedent)
  const a: A = tuple.head(s.result.succedent)
  return dr1(sequent(γ, [disjunction(a, b), ...δ]), [s])
}
export const reverseDR1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR1<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const adb: Disjunction<A, B> = tuple.head(p.result.succedent)
  const a: A = adb.leftDisjunct
  const δ: Δ = tuple.tail(p.result.succedent)
  return dr1(p.result, [premise(sequent(γ, [a, ...δ]))])
}
export const tryReverseDR1 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDR1ResultDerivation(d) ? reverseDR1(d) : null
}
export const exampleDR1 = applyDR1(
  atom('B'),
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
)

export const ruleDR1 = {
  isResult: isDR1Result,
  isResultDerivation: isDR1ResultDerivation,
  make: dr1,
  apply: applyDR1,
  reverse: reverseDR1,
  tryReverse: tryReverseDR1,
  example: exampleDR1,
} satisfies Rule<AnyDR1Result>
