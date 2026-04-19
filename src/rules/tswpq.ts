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
export type TSWPQResult = Sequent<[Atom<'p'>, Atom<'q'>], [Verum]>
export type AnyTSWPQ = TSWPQ
export const isTSWPQResult: Refinement<AnySequent, TSWPQResult> = (
  s,
): s is TSWPQResult =>
  tuple.isTupleOf2(s.antecedent) &&
  equals(s.antecedent[0], pAtom) &&
  equals(s.antecedent[1], qAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWPQResultDerivation = refineDerivation(isTSWPQResult)
export type TSWPQDeps = [Derivation<Sequent<[Atom<'p'>], [Verum]>>]
export type TSWPQ = Transformation<TSWPQResult, TSWPQDeps, 'tswpq'>
export const tswpq = <R extends TSWPQResult>(
  result: R,
  deps: TSWPQDeps,
): Transformation<R, TSWPQDeps, 'tswpq'> => transformation(result, deps, 'tswpq')
export const applyTSWPQ = (
  dep: Derivation<Sequent<[Atom<'p'>], [Verum]>>,
): TSWPQ => {
  const δ = dep.result.succedent
  return tswpq(sequent([pAtom, qAtom], δ), [dep])
}
export const reverseTSWPQ = <R extends TSWPQResult>(
  p: Derivation<R>,
): Transformation<R, TSWPQDeps, 'tswpq'> => {
  const δ = p.result.succedent
  return tswpq(p.result, [premise(sequent([pAtom], δ))])
}
export const tryReverseTSWPQ = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWPQResultDerivation(d) ? reverseTSWPQ(d) : null
export const exampleTSWPQ = applyTSWPQ(premise(sequent([pAtom], [verum])))
export const ruleTSWPQ = {
  id: 'tswpq',
  connectives: [],
  isResult: isTSWPQResult,
  isResultDerivation: isTSWPQResultDerivation,
  make: tswpq,
  apply: applyTSWPQ,
  reverse: reverseTSWPQ,
  tryReverse: tryReverseTSWPQ,
  example: exampleTSWPQ,
} satisfies Rule<TSWPQResult>
