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
  Disjunction,
  isDisjunction,
  disjunction,
  atom,
} from '../model/prop'
import {
  Sequent,
  AnySequent,
  refineActiveL,
  sequent,
} from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type DLResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Disjunction<A, B>], Δ>
export type AnyDLResult = DLResult<Formulas, Prop, Prop, Formulas>
export const isDLResult: Refinement<AnySequent, AnyDLResult> =
  refineActiveL(isDisjunction)
export const isDLResultDerivation = refineDerivation(isDLResult)
export type DL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'dl'
>
export type AnyDL = DL<Formulas, Prop, Prop, Formulas, AnyDLResult>
export const dl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
): DL<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dl')
}
export type ApplyDL<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >,
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >,
]
  ? DL<Γ, A, B, Δ, DLResult<Γ, A, B, Δ>>
  : never
export const applyDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s1: Derivation<Sequent<[...Γ, A], Δ>>,
  s2: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyDL<
  Derivation<Sequent<[...Γ, A], Δ>>,
  Derivation<Sequent<[...Γ, B], Δ>>
> => {
  const γ: Γ = tuple.init(s1.result.antecedent)
  const a: A = tuple.last(s1.result.antecedent)
  const b: B = tuple.last(s2.result.antecedent)
  const δ: Δ = s1.result.succedent
  return dl(sequent([...γ, disjunction(a, b)], δ), [s1, s2])
}
export const reverseDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DL<Γ, A, B, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const adb: Disjunction<A, B> = tuple.last(p.result.antecedent)
  const a: A = adb.leftDisjunct
  const b: B = adb.rightDisjunct
  const δ: Δ = p.result.succedent
  return dl(p.result, [
    premise(sequent([...γ, a], δ)),
    premise(sequent([...γ, b], δ)),
  ])
}
export const tryReverseDL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDLResultDerivation(d) ? reverseDL(d) : null
}
export const exampleDL = applyDL(
  premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
  premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
)

export const ruleDL = {
  id: 'dl',
  isResult: isDLResult,
  isResultDerivation: isDLResultDerivation,
  make: dl,
  apply: applyDL,
  reverse: reverseDL,
  tryReverse: tryReverseDL,
  example: exampleDL,
} satisfies Rule<AnyDLResult>
