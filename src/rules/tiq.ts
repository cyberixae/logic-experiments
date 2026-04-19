import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import { atom, Atom, equals } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

const qAtom = atom('q')

export type TiqResult = Sequent<[Atom<'q'>], [Atom<'q'>]>
export type AnyTiqResult = TiqResult
export const isTiqResult: Refinement<AnySequent, AnyTiqResult> = (
  s,
): s is AnyTiqResult =>
  tuple.isTupleOf1(s.antecedent) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.antecedent[0], qAtom) &&
  equals(s.succedent[0], qAtom)

export const isTiqResultDerivation = refineDerivation(isTiqResult)
export type Tiq<R extends TiqResult> = Introduction<R, 'tiq'>
export type AnyTiq = Tiq<AnyTiqResult>
export const tiq = <R extends TiqResult>(result: R): Tiq<R> =>
  introduction(result, 'tiq')
export type ApplyTiq = Tiq<TiqResult>
export const applyTiq = (): ApplyTiq => tiq(sequent([qAtom], [qAtom]))
export const reverseTiq = <R extends TiqResult>(p: Derivation<R>): Tiq<R> =>
  tiq(p.result)
export const tryReverseTiq = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => (isTiqResultDerivation(d) ? reverseTiq(d) : null)
export const exampleTiq = applyTiq()

export const ruleTiq = {
  id: 'tiq',
  connectives: [],
  isResult: isTiqResult,
  isResultDerivation: isTiqResultDerivation,
  make: tiq,
  apply: applyTiq,
  reverse: reverseTiq,
  tryReverse: tryReverseTiq,
  example: exampleTiq,
} satisfies Rule<AnyTiqResult>
