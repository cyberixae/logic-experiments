import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom, verum, Verum, equals } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type TSWResult<
  Γ extends Formulas,
  A extends Prop,
> = Sequent<[...Γ, A], [Verum]>
export type AnyTSWResult = TSWResult<Formulas, Prop>
export const isTSWResult: Refinement<AnySequent, AnyTSWResult> = (
  s,
): s is AnyTSWResult => {
  return (
    s.antecedent.length > 0 &&
    tuple.isTupleOf1(s.succedent) &&
    equals(s.succedent[0], verum)
  )
}
export const isTSWResultDerivation = refineDerivation(isTSWResult)
export type TSWDeps<Γ extends Formulas> = [Derivation<Sequent<Γ, [Verum]>>]
export type AnyTSWDeps = TSWDeps<Formulas>
export type TSW<
  Γ extends Formulas,
  A extends Prop,
  R extends TSWResult<Γ, A>,
  D extends TSWDeps<Γ>,
> = Transformation<R, D, 'tsw'>
export type AnyTSW = TSW<Formulas, Prop, AnyTSWResult, AnyTSWDeps>
export const tsw = <
  Γ extends Formulas,
  A extends Prop,
  R extends TSWResult<Γ, A>,
  D extends TSWDeps<Γ>,
>(
  result: R,
  deps: D,
): TSW<Γ, A, R, D> => transformation(result, deps, 'tsw')
export const applyTSW = <
  A extends Prop,
  Γ extends Formulas,
  D extends TSWDeps<Γ>,
>(
  a: A,
  ...deps: D & TSWDeps<Γ>
): TSW<Γ, A, TSWResult<Γ, A>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ = dep.result.succedent
  return tsw(sequent([...γ, a], δ), deps)
}
export const reverseTSW = <
  Γ extends Formulas,
  A extends Prop,
  R extends TSWResult<Γ, A>,
>(
  p: Derivation<R>,
): TSW<Γ, A, R, TSWDeps<Γ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const δ = p.result.succedent
  return tsw(p.result, [premise(sequent(γ, δ))])
}
export const tryReverseTSW = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null =>
  isTSWResultDerivation(d) ? reverseTSW(d) : null
export const exampleTSW = applyTSW(
  atom('A'),
  premise(sequent([atom('Γ')], [verum])),
)

export const ruleTSW = {
  id: 'tsw',
  connectives: [],
  isResult: isTSWResult,
  isResultDerivation: isTSWResultDerivation,
  make: tsw,
  apply: applyTSW,
  reverse: reverseTSW,
  tryReverse: tryReverseTSW,
  example: exampleTSW,
} satisfies Rule<AnyTSWResult>
