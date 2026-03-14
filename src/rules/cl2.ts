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

export type CL2Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Conjunction<A, B>], Δ>
export type AnyCL2Result = CL2Result<Formulas, Prop, Prop, Formulas>
export const isCL2Result: Refinement<AnySequent, AnyCL2Result> =
  refineActiveL(isConjunction)
export const isCL2ResultDerivation = refineDerivation(isCL2Result)
export type CL2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, B], Δ>>], 'cl2'>
export type AnyCL2 = CL2<Formulas, Prop, Prop, Formulas, AnyCL2Result>
export const cl2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, B], Δ>>],
): CL2<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cl2')
}
export type ApplyCL2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >
    ? CL2<Γ, A, B, Δ, CL2Result<Γ, A, B, Δ>>
    : never
export const applyCL2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyCL2<A, Derivation<Sequent<[...Γ, B], Δ>>> => {
  const γ: Γ = tuple.init(s.result.antecedent)
  const b: B = tuple.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return cl2(sequent([...γ, conjunction(a, b)], δ), [s])
}
export const reverseCL2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL2<Γ, A, B, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
  const b: B = acb.rightConjunct
  const δ: Δ = p.result.succedent
  return cl2(p.result, [premise(sequent([...γ, b], δ))])
}
export const tryReverseCL2 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCL2ResultDerivation(d) ? reverseCL2(d) : null
}
export const exampleCL2 = applyCL2(
  atom('A'),
  premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
)

export const ruleCL2 = {
  isResult: isCL2Result,
  isResultDerivation: isCL2ResultDerivation,
  make: cl2,
  apply: applyCL2,
  reverse: reverseCL2,
  tryReverse: tryReverseCL2,
  example: exampleCL2,
} satisfies Rule<AnyCL2Result>
