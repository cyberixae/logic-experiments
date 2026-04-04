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

export type SXLResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, B, A], Δ>
export type AnySXLResult = SXLResult<Formulas, Prop, Prop, Formulas>
export const isSXLResult: Refinement<AnySequent, AnySXLResult> = (
  s,
): s is AnySXLResult => {
  return s.antecedent.length > 1
}
export const isSXLResultDerivation = refineDerivation(isSXLResult)
export type SXLDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[...Γ, A, B], Δ>>]
export type AnySXLDeps = SXLDeps<Formulas, Prop, Prop, Formulas>
export type SXL<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
  D extends SXLDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'sxl'>
export type AnySXL = SXL<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnySXLResult,
  AnySXLDeps
>
export const sxl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
  D extends SXLDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): SXL<Γ, B, A, Δ, R, D> => {
  return transformation(result, deps, 'sxl')
}
export const applySXL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends SXLDeps<Γ, A, B, Δ>,
>(
  ...deps: D & SXLDeps<Γ, A, B, Δ>
): SXL<Γ, B, A, Δ, SXLResult<Γ, B, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const b: B = tuple.last(dep.result.antecedent)
  const a: A = tuple.last(tuple.init(dep.result.antecedent))
  const δ: Δ = dep.result.succedent
  return sxl(sequent([...γ, b, a], δ), deps)
}
export const reverseSXL = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SXL<Γ, B, A, Δ, R, SXLDeps<Γ, A, B, Δ>> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent))
  const a: A = tuple.last(p.result.antecedent)
  const b: B = tuple.last(tuple.init(p.result.antecedent))
  const δ: Δ = p.result.succedent
  return sxl(p.result, [premise(sequent([...γ, a, b], δ))])
}
export const tryReverseSXL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSXLResultDerivation(d) ? reverseSXL(d) : null
}
export const exampleSXL = applySXL(
  premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')])),
)

export const ruleSXL = {
  id: 'sxl',
  connectives: [],
  isResult: isSXLResult,
  isResultDerivation: isSXLResultDerivation,
  make: sxl,
  apply: applySXL,
  reverse: reverseSXL,
  tryReverse: tryReverseSXL,
  example: exampleSXL,
} satisfies Rule<AnySXLResult>
