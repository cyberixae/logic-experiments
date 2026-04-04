import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import { equals, verum, Verum } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type VResult = Sequent<[], [Verum]>
export type AnyVResult = VResult
export const isVResult: Refinement<AnySequent, AnyVResult> = (
  s,
): s is AnyVResult => {
  return (
    tuple.isTupleOf0(s.antecedent) &&
    tuple.isTupleOf1(s.succedent) &&
    equals(s.succedent[0], verum)
  )
}
export const isVResultDerivation = refineDerivation(isVResult)
export type V<R extends VResult> = Introduction<R, 'v'>
export type AnyV = V<AnyVResult>
export const v = <R extends VResult>(result: R): V<R> =>
  introduction(result, 'v')
export type ApplyV = V<VResult>
export const applyV = (): ApplyV => v(sequent([], [verum]))
export const reverseV = <R extends VResult>(p: Derivation<R>): V<R> => {
  return v(p.result)
}
export const tryReverseV = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isVResultDerivation(d) ? reverseV(d) : null
}
export const exampleV = applyV()

export const ruleV = {
  id: 'v',
  connectives: ['verum'],
  isResult: isVResult,
  isResultDerivation: isVResultDerivation,
  make: v,
  apply: applyV,
  reverse: reverseV,
  tryReverse: tryReverseV,
  example: exampleV,
} satisfies Rule<AnyVResult>
