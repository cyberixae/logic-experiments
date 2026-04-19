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
export type TSWQQResult = Sequent<[Atom<'q'>, Atom<'q'>], [Verum]>
export type AnyTSWQQ = TSWQQ
export const isTSWQQResult: Refinement<AnySequent, TSWQQResult> = (
  s,
): s is TSWQQResult =>
  tuple.isTupleOf2(s.antecedent) &&
  equals(s.antecedent[0], qAtom) &&
  equals(s.antecedent[1], qAtom) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.succedent[0], verum)
export const isTSWQQResultDerivation = refineDerivation(isTSWQQResult)
export type TSWQQDeps = [Derivation<Sequent<[Atom<'q'>], [Verum]>>]
export type TSWQQ = Transformation<TSWQQResult, TSWQQDeps, 'tswqq'>
export const tswqq = <R extends TSWQQResult, D extends TSWQQDeps>(
  result: R,
  deps: D,
): Transformation<R, D, 'tswqq'> => transformation(result, deps, 'tswqq')
export const applyTSWQQ = <D extends TSWQQDeps>(
  ...deps: D & TSWQQDeps
): Transformation<TSWQQResult, D, 'tswqq'> => {
  const [dep] = deps
  const δ = dep.result.succedent
  return tswqq(sequent([qAtom, qAtom], δ), deps)
}
export const reverseTSWQQ = <R extends TSWQQResult>(
  p: Derivation<R>,
): Transformation<R, TSWQQDeps, 'tswqq'> => {
  const δ = p.result.succedent
  return tswqq(p.result, [premise(sequent([qAtom], δ))])
}
export const tryReverseTSWQQ = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWQQResultDerivation(d) ? reverseTSWQQ(d) : null
export const exampleTSWQQ = applyTSWQQ(premise(sequent([qAtom], [verum])))
export const ruleTSWQQ = {
  id: 'tswqq',
  connectives: [],
  isResult: isTSWQQResult,
  isResultDerivation: isTSWQQResultDerivation,
  make: tswqq,
  apply: applyTSWQQ,
  reverse: reverseTSWQQ,
  tryReverse: tryReverseTSWQQ,
  example: exampleTSWQQ,
} satisfies Rule<TSWQQResult>
