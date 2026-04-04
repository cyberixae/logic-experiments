import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import { equals, falsum, Falsum } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type FResult = Sequent<[Falsum], []>
export type AnyFResult = FResult
export const isFResult: Refinement<AnySequent, AnyFResult> = (
  s,
): s is AnyFResult => {
  return (
    tuple.isTupleOf1(s.antecedent) &&
    tuple.isTupleOf0(s.succedent) &&
    equals(s.antecedent[0], falsum)
  )
}
export const isFResultDerivation = refineDerivation(isFResult)
export type F<R extends FResult> = Introduction<R, 'f'>
export type AnyF = F<AnyFResult>
export const f = <R extends FResult>(result: R): F<R> =>
  introduction(result, 'f')
export type ApplyF = F<FResult>
export const applyF = (): ApplyF => f(sequent([falsum], []))
export const reverseF = <R extends FResult>(p: Derivation<R>): F<R> => {
  return f(p.result)
}
export const tryReverseF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isFResultDerivation(d) ? reverseF(d) : null
}
export const exampleF = applyF()

export const ruleF = {
  id: 'f',
  connectives: ['falsum'],
  isResult: isFResult,
  isResultDerivation: isFResultDerivation,
  make: f,
  apply: applyF,
  reverse: reverseF,
  tryReverse: tryReverseF,
  example: exampleF,
} satisfies Rule<AnyFResult>
