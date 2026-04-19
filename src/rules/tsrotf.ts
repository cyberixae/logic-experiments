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

export type TSRotFResult<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
> = Sequent<[A, ...Γ, B], [Verum]>
export type AnyTSRotFResult = TSRotFResult<Prop, Formulas, Prop>
export const isTSRotFResult: Refinement<AnySequent, AnyTSRotFResult> = (
  s,
): s is AnyTSRotFResult =>
  s.antecedent.length > 1 &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSRotFResultDerivation = refineDerivation(isTSRotFResult)
export type TSRotFDeps<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
> = [Derivation<Sequent<[...Γ, B, A], [Verum]>>]
export type AnyTSRotFDeps = TSRotFDeps<Formulas, Prop, Prop>
export type TSRotF<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  R extends TSRotFResult<A, Γ, B>,
  D extends TSRotFDeps<Γ, B, A>,
> = Transformation<R, D, 'tsrotf'>
export type AnyTSRotF = TSRotF<
  Prop,
  Formulas,
  Prop,
  AnyTSRotFResult,
  AnyTSRotFDeps
>
export const tsrotf = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  R extends TSRotFResult<A, Γ, B>,
  D extends TSRotFDeps<Γ, B, A>,
>(
  result: R,
  deps: D,
): TSRotF<A, Γ, B, R, D> => transformation(result, deps, 'tsrotf')
export const applyTSRotF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  D extends TSRotFDeps<Γ, B, A>,
>(
  ...deps: D & TSRotFDeps<Γ, B, A>
): TSRotF<A, Γ, B, TSRotFResult<A, Γ, B>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const a: A = tuple.last(dep.result.antecedent)
  const b: B = tuple.last(tuple.init(dep.result.antecedent))
  const δ = dep.result.succedent
  return tsrotf(sequent([a, ...γ, b], δ), deps)
}
export const reverseTSRotF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  R extends TSRotFResult<A, Γ, B>,
>(
  p: Derivation<R>,
): TSRotF<A, Γ, B, R, TSRotFDeps<Γ, B, A>> => {
  const γ: Γ = tuple.init(tuple.tail(p.result.antecedent))
  const a: A = tuple.head(p.result.antecedent)
  const b: B = tuple.last(p.result.antecedent)
  const δ = p.result.succedent
  return tsrotf(p.result, [premise(sequent([...γ, b, a], δ))])
}
export const tryReverseTSRotF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSRotFResultDerivation(d) ? reverseTSRotF(d) : null
export const exampleTSRotF = applyTSRotF(
  premise(sequent([atom('Γ'), atom('B'), atom('A')], [verum])),
)
export const ruleTSRotF = {
  id: 'tsrotf',
  connectives: [],
  isResult: isTSRotFResult,
  isResultDerivation: isTSRotFResultDerivation,
  make: tsrotf,
  apply: applyTSRotF,
  reverse: reverseTSRotF,
  tryReverse: tryReverseTSRotF,
  example: exampleTSRotF,
} satisfies Rule<AnyTSRotFResult>
