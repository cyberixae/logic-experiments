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
export type DRDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<Γ, [A, B, ...Δ]>>]
export type AnyDRDeps = DRDeps<Formulas, Prop, Prop, Formulas>
export type DR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
  D extends DRDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'dr'>
export type AnyDR = DR<Formulas, Prop, Prop, Formulas, AnyDRResult, AnyDRDeps>
export const dr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
  D extends DRDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): DR<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'dr')
}
export const applyDR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends DRDeps<Γ, A, B, Δ>,
>(
  ...deps: D & DRDeps<Γ, A, B, Δ>
): DR<Γ, A, B, Δ, DRResult<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const a: A = tuple.head(dep.result.succedent)
  const b: B = tuple.head(tuple.tail(dep.result.succedent))
  const δ: Δ = tuple.tail(tuple.tail(dep.result.succedent))
  return dr(sequent(γ, [disjunction(a, b), ...δ]), deps)
}
export const reverseDR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR<Γ, A, B, Δ, R, DRDeps<Γ, A, B, Δ>> => {
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
  id: 'dr',
  connectives: ['disjunction'],
  isResult: isDRResult,
  isResultDerivation: isDRResultDerivation,
  make: dr,
  apply: applyDR,
  reverse: reverseDR,
  tryReverse: tryReverseDR,
  example: exampleDR,
} satisfies Rule<AnyDRResult>
