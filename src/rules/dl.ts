import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Disjunction,
  isDisjunction,
  disjunction,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent'
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
export type DLDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>]
export type AnyDLDeps = DLDeps<Formulas, Prop, Prop, Formulas>
export type DL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
  D extends DLDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'dl'>
export type AnyDL = DL<Formulas, Prop, Prop, Formulas, AnyDLResult, AnyDLDeps>
export const dl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
  D extends DLDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): DL<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'dl')
}
export const applyDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends DLDeps<Γ, A, B, Δ>,
>(
  ...deps: D & DLDeps<Γ, A, B, Δ>
): DL<Γ, A, B, Δ, DLResult<Γ, A, B, Δ>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = tuple.init(dep1.result.antecedent)
  const a: A = tuple.last(dep1.result.antecedent)
  const b: B = tuple.last(dep2.result.antecedent)
  const δ: Δ = dep1.result.succedent
  return dl(sequent([...γ, disjunction(a, b)], δ), deps)
}
export const reverseDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DL<Γ, A, B, Δ, R, DLDeps<Γ, A, B, Δ>> => {
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
