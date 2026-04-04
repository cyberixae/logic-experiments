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

export type CL1Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Conjunction<A, B>], Δ>
export type AnyCL1Result = CL1Result<Formulas, Prop, Prop, Formulas>
export const isCL1Result: Refinement<AnySequent, AnyCL1Result> =
  refineActiveL(isConjunction)
export const isCL1ResultDerivation = refineDerivation(isCL1Result)
export type CL1Deps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<[...Γ, A], Δ>>,
]
export type AnyCL1Deps = CL1Deps<Formulas, Prop, Formulas>
export type CL1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
  D extends CL1Deps<Γ, A, Δ>,
> = Transformation<R, D, 'cl1'>
export type AnyCL1 = CL1<
  Formulas,
  Prop,
  Prop,
  Formulas,
  AnyCL1Result,
  AnyCL1Deps
>
export const cl1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
  D extends CL1Deps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): CL1<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'cl1')
}
export const applyCL1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  D extends CL1Deps<Γ, A, Δ>,
>(
  b: B,
  ...deps: D & CL1Deps<Γ, A, Δ>
): CL1<Γ, A, B, Δ, CL1Result<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(dep.result.antecedent)
  const a: A = tuple.last(dep.result.antecedent)
  const δ: Δ = dep.result.succedent
  return cl1(sequent([...γ, conjunction(a, b)], δ), deps)
}
export const reverseCL1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL1<Γ, A, B, Δ, R, CL1Deps<Γ, A, Δ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
  const a: A = acb.leftConjunct
  const δ: Δ = p.result.succedent
  return cl1(p.result, [premise(sequent([...γ, a], δ))])
}
export const tryReverseCL1 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCL1ResultDerivation(d) ? reverseCL1(d) : null
}
export const exampleCL1 = applyCL1(
  atom('B'),
  premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
)

export const ruleCL1 = {
  id: 'cl1',
  connectives: ['conjunction'],
  isResult: isCL1Result,
  isResultDerivation: isCL1ResultDerivation,
  make: cl1,
  apply: applyCL1,
  reverse: reverseCL1,
  tryReverse: tryReverseCL1,
  example: exampleCL1,
} satisfies Rule<AnyCL1Result>
