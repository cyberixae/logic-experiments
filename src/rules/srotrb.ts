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
export type SRotRBDeps<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
> = [Derivation<Sequent<Γ, [B, ...Δ, A]>>]
export type AnySRotRBDeps = SRotRBDeps<Formulas, Prop, Formulas, Prop>
export type SRotRB<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
  D extends SRotRBDeps<Γ, B, Δ, A>,
> = Transformation<R, D, 'sRotRB'>
export type AnySRotRB = SRotRB<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnySRotRBResult,
  AnySRotRBDeps
>
export const sRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
  D extends SRotRBDeps<Γ, B, Δ, A>,
>(
  result: R,
  deps: D,
): SRotRB<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'sRotRB')
}
export const applySRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends SRotRBDeps<Γ, B, Δ, A>,
>(
  ...deps: D & SRotRBDeps<Γ, B, Δ, A>
): SRotRB<Γ, A, B, Δ, SRotRBResult<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ: Δ = tuple.init(tuple.tail(dep.result.succedent))
  const a: A = tuple.last(dep.result.succedent)
  const b: B = tuple.head(dep.result.succedent)
  return sRotRB(sequent(γ, [a, b, ...δ]), deps)
}
export const reverseSRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): SRotRB<Γ, A, B, Δ, R, SRotRBDeps<Γ, B, Δ, A>> => {
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
  connectives: [],
  isResult: isSRotRBResult,
  isResultDerivation: isSRotRBResultDerivation,
  make: sRotRB,
  apply: applySRotRB,
  reverse: reverseSRotRB,
  tryReverse: tryReverseSRotRB,
  example: exampleSRotRB,
} satisfies Rule<AnySRotRBResult>
