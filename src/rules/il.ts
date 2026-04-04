import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Implication,
  isImplication,
  implication,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
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
export type ILDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>]
export type AnyILDeps = ILDeps<Formulas, Prop, Prop, Formulas>
export type IL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
  D extends ILDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'il'>
export type AnyIL = IL<Formulas, Prop, Prop, Formulas, AnyILResult, AnyILDeps>
export const il = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
  D extends ILDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): IL<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'il')
}
export const applyIL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  B extends Prop,
  D extends ILDeps<Γ, A, B, Δ>,
>(
  ...deps: D & ILDeps<Γ, A, B, Δ>
): IL<Γ, A, B, Δ, ILResult<Γ, A, B, Δ>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = dep1.result.antecedent
  const a: A = tuple.head(dep1.result.succedent)
  const b: B = tuple.last(dep2.result.antecedent)
  const δ: Δ = tuple.tail(dep1.result.succedent)
  return il(sequent([...γ, implication(a, b)], δ), deps)
}
export const reverseIL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): IL<Γ, A, B, Δ, R, ILDeps<Γ, A, B, Δ>> => {
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
  connectives: ['implication'],
  isResult: isILResult,
  isResultDerivation: isILResultDerivation,
  make: il,
  apply: applyIL,
  reverse: reverseIL,
  tryReverse: tryReverseIL,
  example: exampleIL,
} satisfies Rule<AnyILResult>
