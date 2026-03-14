import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Conjunction,
  isConjunction,
  conjunction,
  atom,
} from '../model/prop'
import {
  Formulas,
  Sequent,
  AnySequent,
  refineActiveL,
  sequent,
} from '../model/sequent'
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
export type CL1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A], Δ>>], 'cl1'>
export type AnyCL1 = CL1<Formulas, Prop, Prop, Formulas, AnyCL1Result>
export const cl1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>],
): CL1<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cl1')
}
export type ApplyCL1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? CL1<Γ, A, B, Δ, CL1Result<Γ, A, B, Δ>>
    : never
export const applyCL1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): ApplyCL1<B, Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = tuple.init(s.result.antecedent)
  const a: A = tuple.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return cl1(sequent([...γ, conjunction(a, b)], δ), [s])
}
export const reverseCL1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL1<Γ, A, B, Δ, R> => {
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
  isResult: isCL1Result,
  isResultDerivation: isCL1ResultDerivation,
  make: cl1,
  apply: applyCL1,
  reverse: reverseCL1,
  tryReverse: tryReverseCL1,
  example: exampleCL1,
} satisfies Rule<AnyCL1Result>
