import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent'
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
export type SRotLB<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[A, ...Γ, B], Δ>>], 'sRotLB'>
export type AnySRotLB = SRotLB<Formulas, Prop, Prop, Formulas, AnySRotLBResult>
export const sRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[A, ...Γ, B], Δ>>],
): SRotLB<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sRotLB')
}
export type ApplySRotLB<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      [infer A extends Prop, ...infer Γ extends Formulas, infer B extends Prop],
      infer Δ
    >
  >
    ? SRotLB<Γ, B, A, Δ, SRotLBResult<Γ, B, A, Δ>>
    : never
export const applySRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[A, ...Γ, B], Δ>>,
): ApplySRotLB<Derivation<Sequent<[A, ...Γ, B], Δ>>> => {
  const a: A = tuple.head(s.result.antecedent)
  const γ: Γ = tuple.init(tuple.tail(s.result.antecedent))
  const b: B = tuple.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return sRotLB(sequent([...γ, b, a], δ), [s])
}
export const reverseSRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SRotLB<Γ, B, A, Δ, R> => {
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
  isResult: isSRotLBResult,
  isResultDerivation: isSRotLBResultDerivation,
  make: sRotLB,
  apply: applySRotLB,
  reverse: reverseSRotLB,
  tryReverse: tryReverseSRotLB,
  example: exampleSRotLB,
} satisfies Rule<AnySRotLBResult>
