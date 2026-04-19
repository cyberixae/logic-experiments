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

const pAtom = atom('p')
const qAtom = atom('q')
export type TSWQPResult = Sequent<[Atom<'q'>, Atom<'p'>], [Verum]>
export type AnyTSWQP = TSWQP
export const isTSWQPResult: Refinement<AnySequent, TSWQPResult> = (
  s,
): s is TSWQPResult =>
  tuple.isTupleOf2(s.antecedent) &&
  equals(s.antecedent[0], qAtom) &&
  equals(s.antecedent[1], pAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWQPResultDerivation = refineDerivation(isTSWQPResult)
export type TSWQPDeps = [Derivation<Sequent<[Atom<'q'>], [Verum]>>]
export type TSWQP = Transformation<TSWQPResult, TSWQPDeps, 'tswqp'>
export const tswqp = <R extends TSWQPResult>(
  result: R,
  deps: TSWQPDeps,
): Transformation<R, TSWQPDeps, 'tswqp'> => transformation(result, deps, 'tswqp')
export const applyTSWQP = (
  dep: Derivation<Sequent<[Atom<'q'>], [Verum]>>,
): TSWQP => {
  const δ = dep.result.succedent
  return tswqp(sequent([qAtom, pAtom], δ), [dep])
}
export const reverseTSWQP = <R extends TSWQPResult>(
  p: Derivation<R>,
): Transformation<R, TSWQPDeps, 'tswqp'> => {
  const δ = p.result.succedent
  return tswqp(p.result, [premise(sequent([qAtom], δ))])
}
export const tryReverseTSWQP = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWQPResultDerivation(d) ? reverseTSWQP(d) : null
export const exampleTSWQP = applyTSWQP(premise(sequent([qAtom], [verum])))
export const ruleTSWQP = {
  id: 'tswqp',
  connectives: [],
  isResult: isTSWQPResult,
  isResultDerivation: isTSWQPResultDerivation,
  make: tswqp,
  apply: applyTSWQP,
  reverse: reverseTSWQP,
  tryReverse: tryReverseTSWQP,
  example: exampleTSWQP,
} satisfies Rule<TSWQPResult>
