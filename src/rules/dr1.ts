import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, Disjunction, disjunction, atom } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
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
export type DR1Deps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<Γ, [A, ...Δ]>>,
]
export type AnyDR1Deps = DR1Deps<Formulas, Prop, Formulas>
export type DR1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
  D extends DR1Deps<Γ, A, Δ>,
> = Transformation<R, D, 'dr1'>
export type AnyDR1 = DR1<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnyDR1Result,
  AnyDR1Deps
>
export const dr1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
  D extends DR1Deps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): DR1<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'dr1')
}
export const applyDR1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  D extends DR1Deps<Γ, A, Δ>,
>(
  b: B,
  ...deps: D & DR1Deps<Γ, A, Δ>
): DR1<Γ, A, B, Δ, DR1Result<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ: Δ = tuple.tail(dep.result.succedent)
  const a: A = tuple.head(dep.result.succedent)
  return dr1(sequent(γ, [disjunction(a, b), ...δ]), deps)
}
export const reverseDR1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR1<Γ, A, B, Δ, R, DR1Deps<Γ, A, Δ>> => {
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
  id: 'dr1',
  isResult: isDR1Result,
  isResultDerivation: isDR1ResultDerivation,
  make: dr1,
  apply: applyDR1,
  reverse: reverseDR1,
  tryReverse: tryReverseDR1,
  example: exampleDR1,
} satisfies Rule<AnyDR1Result>
