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

export type SRotLFResult<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[A, ...Γ, B], Δ>
export type AnySRotLFResult = SRotLFResult<Prop, Formulas, Prop, Formulas>
export const isSRotLFResult: Refinement<AnySequent, AnySRotLFResult> = (
  s,
): s is AnySRotLFResult => {
  return s.antecedent.length > 1
}
export const isSRotLFResultDerivation = refineDerivation(isSRotLFResult)
export type SRotLFDeps<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[...Γ, B, A], Δ>>]
export type AnySRotLFDeps = SRotLFDeps<Formulas, Prop, Prop, Formulas>
export type SRotLF<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
  D extends SRotLFDeps<Γ, B, A, Δ>,
> = Transformation<R, D, 'sRotLF'>
export type AnySRotLF = SRotLF<
  Prop,
  Formulas,
  Prop,
  Formulas,
  AnySRotLFResult,
  AnySRotLFDeps
>
export const sRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
  D extends SRotLFDeps<Γ, B, A, Δ>,
>(
  result: R,
  deps: D,
): SRotLF<A, Γ, B, Δ, R, D> => {
  return transformation(result, deps, 'sRotLF')
}
export const applySRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  D extends SRotLFDeps<Γ, B, A, Δ>,
>(
  ...deps: D & SRotLFDeps<Γ, B, A, Δ>
): SRotLF<A, Γ, B, Δ, SRotLFResult<A, Γ, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const a: A = tuple.last(dep.result.antecedent)
  const b: B = tuple.last(tuple.init(dep.result.antecedent))
  const δ: Δ = dep.result.succedent
  return sRotLF(sequent([a, ...γ, b], δ), deps)
}
export const reverseSRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
>(
  p: Derivation<R>,
): SRotLF<A, Γ, B, Δ, R, SRotLFDeps<Γ, B, A, Δ>> => {
  const γ: Γ = tuple.init(tuple.tail(p.result.antecedent))
  const a: A = tuple.head(p.result.antecedent)
  const b: B = tuple.last(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return sRotLF(p.result, [premise(sequent([...γ, b, a], δ))])
}
export const tryReverseSRotLF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotLFResultDerivation(d) ? reverseSRotLF(d) : null
}
export const exampleSRotLF = applySRotLF(
  premise(sequent([atom('Γ'), atom('B'), atom('A')], [atom('Δ')])),
)

export const ruleSRotLF = {
  id: 'sRotLF',
  connectives: [],
  isResult: isSRotLFResult,
  isResultDerivation: isSRotLFResultDerivation,
  make: sRotLF,
  apply: applySRotLF,
  reverse: reverseSRotLF,
  tryReverse: tryReverseSRotLF,
  example: exampleSRotLF,
} satisfies Rule<AnySRotLFResult>
