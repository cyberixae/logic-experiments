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
  Implication,
  isImplication,
  implication,
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

export type ILResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Implication<A, B>], Δ>
export type AnyILResult = ILResult<Formulas, Prop, Prop, Formulas>
export const isILResult: Refinement<AnySequent, AnyILResult> =
  refineActiveL(isImplication)
export const isILResultDerivation = refineDerivation(isILResult)
export type IL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'il'
>
export type AnyIL = IL<Formulas, Prop, Prop, Formulas, AnyILResult>
export const il = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
): IL<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'il')
}
export type ApplyIL<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >,
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >,
]
  ? IL<Γ, A, B, Δ, ILResult<Γ, A, B, Δ>>
  : never
export const applyIL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  B extends Prop,
>(
  s1: Derivation<Sequent<Γ, [A, ...Δ]>>,
  s2: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyIL<
  Derivation<Sequent<Γ, [A, ...Δ]>>,
  Derivation<Sequent<[...Γ, B], Δ>>
> => {
  const γ: Γ = s1.result.antecedent
  const a: A = tuple.head(s1.result.succedent)
  const b: B = tuple.last(s2.result.antecedent)
  const δ: Δ = tuple.tail(s1.result.succedent)
  return il(sequent([...γ, implication(a, b)], δ), [s1, s2])
}
export const reverseIL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): IL<Γ, A, B, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const aib: Implication<A, B> = tuple.last(p.result.antecedent)
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ: Δ = p.result.succedent
  return il(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent([...γ, b], δ)),
  ])
}
export const tryReverseIL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isILResultDerivation(d) ? reverseIL(d) : null
}
export const exampleIL = applyIL(
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
  premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
)

export const ruleIL = {
  id: 'il',
  isResult: isILResult,
  isResultDerivation: isILResultDerivation,
  make: il,
  apply: applyIL,
  reverse: reverseIL,
  tryReverse: tryReverseIL,
  example: exampleIL,
} satisfies Rule<AnyILResult>
