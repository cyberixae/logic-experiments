import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Disjunction,
  isDisjunction,
  disjunction,
  atom,
  verum,
  Verum,
  equals,
} from '../model/prop'
import { Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type TDResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
> = Sequent<[...Γ, Disjunction<A, B>], [Verum]>
export type AnyTDResult = TDResult<Formulas, Prop, Prop>
export const isTDResult: Refinement<AnySequent, AnyTDResult> = (
  s,
): s is AnyTDResult => {
  return (
    refineActiveL(isDisjunction)(s) &&
    tuple.isTupleOf1(s.succedent) &&
    equals(s.succedent[0], verum)
  )
}
export const isTDResultDerivation = refineDerivation(isTDResult)
export type TDDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
> = [
  Derivation<Sequent<[...Γ, A], [Verum]>>,
  Derivation<Sequent<[...Γ, B], [Verum]>>,
]
export type AnyTDDeps = TDDeps<Formulas, Prop, Prop>
export type TD<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TDResult<Γ, A, B>,
  D extends TDDeps<Γ, A, B>,
> = Transformation<R, D, 'td'>
export type AnyTD = TD<Formulas, Prop, Prop, AnyTDResult, AnyTDDeps>
export const td = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TDResult<Γ, A, B>,
  D extends TDDeps<Γ, A, B>,
>(
  result: R,
  deps: D,
): TD<Γ, A, B, R, D> => transformation(result, deps, 'td')
export const applyTD = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  D extends TDDeps<Γ, A, B>,
>(
  ...deps: D & TDDeps<Γ, A, B>
): TD<Γ, A, B, TDResult<Γ, A, B>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = tuple.init(dep1.result.antecedent)
  const a: A = tuple.last(dep1.result.antecedent)
  const b: B = tuple.last(dep2.result.antecedent)
  const δ = dep1.result.succedent
  return td(sequent([...γ, disjunction(a, b)], δ), deps)
}
export const reverseTD = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TDResult<Γ, A, B>,
>(
  p: Derivation<R>,
): TD<Γ, A, B, R, TDDeps<Γ, A, B>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const adb: Disjunction<A, B> = tuple.last(p.result.antecedent)
  const a: A = adb.leftDisjunct
  const b: B = adb.rightDisjunct
  const δ = p.result.succedent
  return td(p.result, [
    premise(sequent([...γ, a], δ)),
    premise(sequent([...γ, b], δ)),
  ])
}
export const tryReverseTD = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => (isTDResultDerivation(d) ? reverseTD(d) : null)
export const exampleTD = applyTD(
  premise(sequent([atom('Γ'), atom('A')], [verum])),
  premise(sequent([atom('Γ'), atom('B')], [verum])),
)

export const ruleTD = {
  id: 'td',
  connectives: ['disjunction'],
  isResult: isTDResult,
  isResultDerivation: isTDResultDerivation,
  make: td,
  apply: applyTD,
  reverse: reverseTD,
  tryReverse: tryReverseTD,
  example: exampleTD,
} satisfies Rule<AnyTDResult>
