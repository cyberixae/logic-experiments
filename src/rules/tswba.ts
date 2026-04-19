import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom, verum, Verum, equals } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type TSWBAResult<B extends Prop, A extends Prop> = Sequent<[B, A], [Verum]>
export type AnyTSWBAResult = TSWBAResult<Prop, Prop>
export const isTSWBAResult: Refinement<AnySequent, AnyTSWBAResult> = (
  s,
): s is AnyTSWBAResult =>
  tuple.isTupleOf2(s.antecedent) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWBAResultDerivation = refineDerivation(isTSWBAResult)
export type TSWBADeps<B extends Prop> = [Derivation<Sequent<[B], [Verum]>>]
export type AnyTSWBADeps = TSWBADeps<Prop>
export type TSWBA<
  B extends Prop,
  A extends Prop,
  R extends TSWBAResult<B, A>,
  D extends TSWBADeps<B>,
> = Transformation<R, D, 'tswba'>
export type AnyTSWBA = TSWBA<Prop, Prop, AnyTSWBAResult, AnyTSWBADeps>
export const tswba = <
  B extends Prop,
  A extends Prop,
  R extends TSWBAResult<B, A>,
  D extends TSWBADeps<B>,
>(
  result: R,
  deps: D,
): Transformation<R, D, 'tswba'> => transformation(result, deps, 'tswba')
export const applyTSWBA = <
  A extends Prop,
  B extends Prop,
  D extends TSWBADeps<B>,
>(
  a: A,
  ...deps: D & TSWBADeps<B>
): TSWBA<B, A, TSWBAResult<B, A>, D> => {
  const [dep] = deps
  const [b] = dep.result.antecedent
  const δ = dep.result.succedent
  return tswba(sequent([b, a], δ), deps)
}
export const reverseTSWBA = <
  B extends Prop,
  A extends Prop,
  R extends TSWBAResult<B, A>,
>(
  p: Derivation<R>,
): TSWBA<B, A, R, TSWBADeps<B>> => {
  const b = tuple.head(p.result.antecedent)
  const δ = p.result.succedent
  return tswba(p.result, [premise(sequent([b], δ))])
}
export const tryReverseTSWBA = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWBAResultDerivation(d) ? reverseTSWBA(d) : null
export const exampleTSWBA = applyTSWBA(
  atom('A'),
  premise(sequent([atom('B')], [verum])),
)
export const ruleTSWBA = {
  id: 'tswba',
  connectives: [],
  isResult: isTSWBAResult,
  isResultDerivation: isTSWBAResultDerivation,
  make: tswba,
  apply: applyTSWBA,
  reverse: reverseTSWBA,
  tryReverse: tryReverseTSWBA,
  example: exampleTSWBA,
} satisfies Rule<AnyTSWBAResult>
