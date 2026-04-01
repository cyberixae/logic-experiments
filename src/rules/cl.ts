import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Conjunction,
  isConjunction,
  conjunction,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type CLResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Conjunction<A, B>], Δ>
export type AnyCLResult = CLResult<Formulas, Prop, Prop, Formulas>
export const isCLResult: Refinement<AnySequent, AnyCLResult> =
  refineActiveL(isConjunction)
export const isCLResultDerivation = refineDerivation(isCLResult)
export type CLDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[...Γ, A, B], Δ>>]
export type AnyCLDeps = CLDeps<Formulas, Prop, Prop, Formulas>
export type CL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>,
  D extends CLDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'cl'>
export type AnyCL = CL<Formulas, Prop, Prop, Formulas, AnyCLResult, AnyCLDeps>
export const cl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>,
  D extends CLDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): CL<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'cl')
}
export const applyCL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends CLDeps<Γ, A, B, Δ>,
>(
  ...deps: D & CLDeps<Γ, A, B, Δ>
): CL<Γ, A, B, Δ, CLResult<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const a: A = tuple.last(tuple.init(dep.result.antecedent))
  const b: B = tuple.last(dep.result.antecedent)
  const δ: Δ = dep.result.succedent
  return cl(sequent([...γ, conjunction(a, b)], δ), deps)
}
export const reverseCL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL<Γ, A, B, Δ, R, CLDeps<Γ, A, B, Δ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
  const a: A = acb.leftConjunct
  const b: B = acb.rightConjunct
  const δ: Δ = p.result.succedent
  return cl(p.result, [premise(sequent([...γ, a, b], δ))])
}
export const tryReverseCL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCLResultDerivation(d) ? reverseCL(d) : null
}
export const exampleCL = applyCL(
  premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')])),
)

export const ruleCL = {
  id: 'cl',
  isResult: isCLResult,
  isResultDerivation: isCLResultDerivation,
  make: cl,
  apply: applyCL,
  reverse: reverseCL,
  tryReverse: tryReverseCL,
  example: exampleCL,
} satisfies Rule<AnyCLResult>
