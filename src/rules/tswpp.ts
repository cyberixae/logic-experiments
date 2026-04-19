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
export type TSWPPResult = Sequent<[Atom<'p'>, Atom<'p'>], [Verum]>
export type AnyTSWPP = TSWPP
export const isTSWPPResult: Refinement<AnySequent, TSWPPResult> = (
  s,
): s is TSWPPResult =>
  tuple.isTupleOf2(s.antecedent) &&
  equals(s.antecedent[0], pAtom) &&
  equals(s.antecedent[1], pAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWPPResultDerivation = refineDerivation(isTSWPPResult)
export type TSWPPDeps = [Derivation<Sequent<[Atom<'p'>], [Verum]>>]
export type TSWPP = Transformation<TSWPPResult, TSWPPDeps, 'tswpp'>
export const tswpp = <R extends TSWPPResult>(
  result: R,
  deps: TSWPPDeps,
): Transformation<R, TSWPPDeps, 'tswpp'> => transformation(result, deps, 'tswpp')
export const applyTSWPP = (
  dep: Derivation<Sequent<[Atom<'p'>], [Verum]>>,
): TSWPP => {
  const δ = dep.result.succedent
  return tswpp(sequent([pAtom, pAtom], δ), [dep])
}
export const reverseTSWPP = <R extends TSWPPResult>(
  p: Derivation<R>,
): Transformation<R, TSWPPDeps, 'tswpp'> => {
  const δ = p.result.succedent
  return tswpp(p.result, [premise(sequent([pAtom], δ))])
}
export const tryReverseTSWPP = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWPPResultDerivation(d) ? reverseTSWPP(d) : null
export const exampleTSWPP = applyTSWPP(premise(sequent([pAtom], [verum])))
export const ruleTSWPP = {
  id: 'tswpp',
  connectives: [],
  isResult: isTSWPPResult,
  isResultDerivation: isTSWPPResultDerivation,
  make: tswpp,
  apply: applyTSWPP,
  reverse: reverseTSWPP,
  tryReverse: tryReverseTSWPP,
  example: exampleTSWPP,
} satisfies Rule<TSWPPResult>
