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
export type TSWPResult = Sequent<[Atom<'p'>], [Verum]>
export type AnyTSWP = TSWP
export const isTSWPResult: Refinement<AnySequent, TSWPResult> = (
  s,
): s is TSWPResult =>
  tuple.isTupleOf1(s.antecedent) &&
  equals(s.antecedent[0], pAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWPResultDerivation = refineDerivation(isTSWPResult)
export type TSWPDeps = [Derivation<Sequent<[], [Verum]>>]
export type TSWP = Transformation<TSWPResult, TSWPDeps, 'tswp'>
export const tswp = <R extends TSWPResult>(
  result: R,
  deps: TSWPDeps,
): Transformation<R, TSWPDeps, 'tswp'> => transformation(result, deps, 'tswp')
export const applyTSWP = (dep: Derivation<Sequent<[], [Verum]>>): TSWP => {
  const δ = dep.result.succedent
  return tswp(sequent([pAtom], δ), [dep])
}
export const reverseTSWP = <R extends TSWPResult>(
  p: Derivation<R>,
): Transformation<R, TSWPDeps, 'tswp'> => {
  const δ = p.result.succedent
  return tswp(p.result, [premise(sequent([], δ))])
}
export const tryReverseTSWP = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWPResultDerivation(d) ? reverseTSWP(d) : null
export const exampleTSWP = applyTSWP(premise(sequent([], [verum])))
export const ruleTSWP = {
  id: 'tswp',
  connectives: [],
  isResult: isTSWPResult,
  isResultDerivation: isTSWPResultDerivation,
  make: tswp,
  apply: applyTSWP,
  reverse: reverseTSWP,
  tryReverse: tryReverseTSWP,
  example: exampleTSWP,
} satisfies Rule<TSWPResult>
