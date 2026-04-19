import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom, verum, Verum, equals } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type TSRotBResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
> = Sequent<[...Γ, B, A], [Verum]>
export type AnyTSRotBResult = TSRotBResult<Formulas, Prop, Prop>
export const isTSRotBResult: Refinement<AnySequent, AnyTSRotBResult> = (
  s,
): s is AnyTSRotBResult =>
  s.antecedent.length > 1 &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSRotBResultDerivation = refineDerivation(isTSRotBResult)
export type TSRotBDeps<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
> = [Derivation<Sequent<[A, ...Γ, B], [Verum]>>]
export type AnyTSRotBDeps = TSRotBDeps<Prop, Formulas, Prop>
export type TSRotB<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  R extends TSRotBResult<Γ, B, A>,
  D extends TSRotBDeps<A, Γ, B>,
> = Transformation<R, D, 'tsrotb'>
export type AnyTSRotB = TSRotB<
  Formulas,
  Prop,
  Prop,
  AnyTSRotBResult,
  AnyTSRotBDeps
>
export const tsrotb = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  R extends TSRotBResult<Γ, B, A>,
  D extends TSRotBDeps<A, Γ, B>,
>(
  result: R,
  deps: D,
): TSRotB<Γ, B, A, R, D> => transformation(result, deps, 'tsrotb')
export const applyTSRotB = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  D extends TSRotBDeps<A, Γ, B>,
>(
  ...deps: D & TSRotBDeps<A, Γ, B>
): TSRotB<Γ, B, A, TSRotBResult<Γ, B, A>, D> => {
  const [dep] = deps
  const a: A = tuple.head(dep.result.antecedent)
  const γ: Γ = tuple.init(tuple.tail(dep.result.antecedent))
  const b: B = tuple.last(dep.result.antecedent)
  const δ = dep.result.succedent
  return tsrotb(sequent([...γ, b, a], δ), deps)
}
export const reverseTSRotB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  R extends TSRotBResult<Γ, B, A>,
>(
  p: Derivation<R>,
): TSRotB<Γ, B, A, R, TSRotBDeps<A, Γ, B>> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent))
  const a: A = tuple.last(p.result.antecedent)
  const b: B = tuple.last(tuple.init(p.result.antecedent))
  const δ = p.result.succedent
  return tsrotb(p.result, [premise(sequent([a, ...γ, b], δ))])
}
export const tryReverseTSRotB = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSRotBResultDerivation(d) ? reverseTSRotB(d) : null
export const exampleTSRotB = applyTSRotB(
  premise(sequent([atom('A'), atom('Γ'), atom('B')], [verum])),
)
export const ruleTSRotB = {
  id: 'tsrotb',
  connectives: [],
  isResult: isTSRotBResult,
  isResultDerivation: isTSRotBResultDerivation,
  make: tsrotb,
  apply: applyTSRotB,
  reverse: reverseTSRotB,
  tryReverse: tryReverseTSRotB,
  example: exampleTSRotB,
} satisfies Rule<AnyTSRotBResult>
