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

const pAtom = atom('p')

export type TipResult = Sequent<[Atom<'p'>], [Atom<'p'>]>
export type AnyTipResult = TipResult
export const isTipResult: Refinement<AnySequent, AnyTipResult> = (
  s,
): s is AnyTipResult =>
  tuple.isTupleOf1(s.antecedent) &&
  tuple.isTupleOf1(s.succedent) &&
  equals(s.antecedent[0], pAtom) &&
  equals(s.succedent[0], pAtom)

export const isTipResultDerivation = refineDerivation(isTipResult)
export type Tip<R extends TipResult> = Introduction<R, 'tip'>
export type AnyTip = Tip<AnyTipResult>
export const tip = <R extends TipResult>(result: R): Tip<R> =>
  introduction(result, 'tip')
export type ApplyTip = Tip<TipResult>
export const applyTip = (): ApplyTip => tip(sequent([pAtom], [pAtom]))
export const reverseTip = <R extends TipResult>(p: Derivation<R>): Tip<R> =>
  tip(p.result)
export const tryReverseTip = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => (isTipResultDerivation(d) ? reverseTip(d) : null)
export const exampleTip = applyTip()

export const ruleTip = {
  id: 'tip',
  connectives: [],
  isResult: isTipResult,
  isResultDerivation: isTipResultDerivation,
  make: tip,
  apply: applyTip,
  reverse: reverseTip,
  tryReverse: tryReverseTip,
  example: exampleTip,
} satisfies Rule<AnyTipResult>
