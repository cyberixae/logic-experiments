import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Atom, atom, verum, Verum, equals } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

const qAtom = atom('q')
export type TSWQResult = Sequent<[Atom<'q'>], [Verum]>
export type AnyTSWQ = TSWQ
export const isTSWQResult: Refinement<AnySequent, TSWQResult> = (
  s,
): s is TSWQResult =>
  tuple.isTupleOf1(s.antecedent) &&
  equals(s.antecedent[0], qAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWQResultDerivation = refineDerivation(isTSWQResult)
export type TSWQDeps = [Derivation<Sequent<[], [Verum]>>]
export type TSWQ = Transformation<TSWQResult, TSWQDeps, 'tswq'>
export const tswq = <R extends TSWQResult>(
  result: R,
  deps: TSWQDeps,
): Transformation<R, TSWQDeps, 'tswq'> => transformation(result, deps, 'tswq')
export const applyTSWQ = (dep: Derivation<Sequent<[], [Verum]>>): TSWQ => {
  const δ = dep.result.succedent
  return tswq(sequent([qAtom], δ), [dep])
}
export const reverseTSWQ = <R extends TSWQResult>(
  p: Derivation<R>,
): Transformation<R, TSWQDeps, 'tswq'> => {
  const δ = p.result.succedent
  return tswq(p.result, [premise(sequent([], δ))])
}
export const tryReverseTSWQ = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWQResultDerivation(d) ? reverseTSWQ(d) : null
export const exampleTSWQ = applyTSWQ(premise(sequent([], [verum])))
export const ruleTSWQ = {
  id: 'tswq',
  connectives: [],
  isResult: isTSWQResult,
  isResultDerivation: isTSWQResultDerivation,
  make: tswq,
  apply: applyTSWQ,
  reverse: reverseTSWQ,
  tryReverse: tryReverseTSWQ,
  example: exampleTSWQ,
} satisfies Rule<TSWQResult>
