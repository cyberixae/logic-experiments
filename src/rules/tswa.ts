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

export type TSWAResult<A extends Prop> = Sequent<[A], [Verum]>
export type AnyTSWAResult = TSWAResult<Prop>
export const isTSWAResult: Refinement<AnySequent, AnyTSWAResult> = (
  s,
): s is AnyTSWAResult =>
  tuple.isTupleOf1(s.antecedent) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWAResultDerivation = refineDerivation(isTSWAResult)
export type TSWADepItem = Derivation<Sequent<[], [Verum]>>
export type TSWADeps<D extends TSWADepItem = TSWADepItem> = [D]
export type TSWA<
  A extends Prop,
  R extends TSWAResult<A>,
  D extends TSWADepItem = TSWADepItem,
> = Transformation<R, [D], 'tswa'>
export type AnyTSWA = TSWA<Prop, AnyTSWAResult>
export const tswa = <A extends Prop, R extends TSWAResult<A>, D extends TSWADepItem>(
  result: R,
  deps: [D],
): Transformation<R, [D], 'tswa'> => transformation(result, deps, 'tswa')
export const applyTSWA = <A extends Prop, D extends TSWADepItem>(
  a: A,
  dep: D,
): TSWA<A, TSWAResult<A>, D> => {
  const δ = dep.result.succedent
  return tswa(sequent([a], δ), [dep])
}
export const reverseTSWA = <A extends Prop, R extends TSWAResult<A>>(
  p: Derivation<R>,
): TSWA<A, R> => {
  const δ = p.result.succedent
  return tswa(p.result, [premise(sequent([], δ))])
}
export const tryReverseTSWA = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWAResultDerivation(d) ? reverseTSWA(d) : null
export const exampleTSWA = applyTSWA(
  atom('A'),
  premise(sequent([], [verum])),
)
export const ruleTSWA = {
  id: 'tswa',
  connectives: [],
  isResult: isTSWAResult,
  isResultDerivation: isTSWAResultDerivation,
  make: tswa,
  apply: applyTSWA,
  reverse: reverseTSWA,
  tryReverse: tryReverseTSWA,
  example: exampleTSWA,
} satisfies Rule<AnyTSWAResult>
