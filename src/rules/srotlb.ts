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

export type SRotLBResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, B, A], Δ>
export type AnySRotLBResult = SRotLBResult<Formulas, Prop, Prop, Formulas>
export const isSRotLBResult: Refinement<AnySequent, AnySRotLBResult> = (
  s,
): s is AnySRotLBResult => {
  return s.antecedent.length > 1
}
export const isSRotLBResultDerivation = refineDerivation(isSRotLBResult)
export type SRotLBDeps<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[A, ...Γ, B], Δ>>]
export type AnySRotLBDeps = SRotLBDeps<Prop, Formulas, Prop, Formulas>
export type SRotLB<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
  D extends SRotLBDeps<A, Γ, B, Δ>,
> = Transformation<R, D, 'sRotLB'>
export type AnySRotLB = SRotLB<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnySRotLBResult,
  AnySRotLBDeps
>
export const sRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
  D extends SRotLBDeps<A, Γ, B, Δ>,
>(
  result: R,
  deps: D,
): SRotLB<Γ, B, A, Δ, R, D> => {
  return transformation(result, deps, 'sRotLB')
}
export const applySRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  D extends SRotLBDeps<A, Γ, B, Δ>,
>(
  ...deps: D & SRotLBDeps<A, Γ, B, Δ>
): SRotLB<Γ, B, A, Δ, SRotLBResult<Γ, B, A, Δ>, D> => {
  const [dep] = deps
  const a: A = tuple.head(dep.result.antecedent)
  const γ: Γ = tuple.init(tuple.tail(dep.result.antecedent))
  const b: B = tuple.last(dep.result.antecedent)
  const δ: Δ = dep.result.succedent
  return sRotLB(sequent([...γ, b, a], δ), deps)
}
export const reverseSRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SRotLB<Γ, B, A, Δ, R, SRotLBDeps<A, Γ, B, Δ>> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent))
  const a: A = tuple.last(p.result.antecedent)
  const b: B = tuple.last(tuple.init(p.result.antecedent))
  const δ: Δ = p.result.succedent
  return sRotLB(p.result, [premise(sequent([a, ...γ, b], δ))])
}
export const tryReverseSRotLB = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotLBResultDerivation(d) ? reverseSRotLB(d) : null
}
export const exampleSRotLB = applySRotLB(
  premise(sequent([atom('A'), atom('Γ'), atom('B')], [atom('Δ')])),
)

export const ruleSRotLB = {
  id: 'sRotLB',
  connectives: [],
  isResult: isSRotLBResult,
  isResultDerivation: isSRotLBResultDerivation,
  make: sRotLB,
  apply: applySRotLB,
  reverse: reverseSRotLB,
  tryReverse: tryReverseSRotLB,
  example: exampleSRotLB,
} satisfies Rule<AnySRotLBResult>
