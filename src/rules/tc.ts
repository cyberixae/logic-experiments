import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Conjunction,
  isConjunction,
  conjunction,
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

export type TCResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
> = Sequent<[...Γ, Conjunction<A, B>], [Verum]>
export type AnyTCResult = TCResult<Formulas, Prop, Prop>
export const isTCResult: Refinement<AnySequent, AnyTCResult> = (
  s,
): s is AnyTCResult => {
  return (
    refineActiveL(isConjunction)(s) &&
    tuple.isTupleOf1(s.succedent) &&
    equals(s.succedent[0], verum)
  )
}
export const isTCResultDerivation = refineDerivation(isTCResult)
export type TCDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
> = [Derivation<Sequent<[...Γ, A, B], [Verum]>>]
export type AnyTCDeps = TCDeps<Formulas, Prop, Prop>
export type TC<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TCResult<Γ, A, B>,
  D extends TCDeps<Γ, A, B>,
> = Transformation<R, D, 'tc'>
export type AnyTC = TC<Formulas, Prop, Prop, AnyTCResult, AnyTCDeps>
export const tc = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TCResult<Γ, A, B>,
  D extends TCDeps<Γ, A, B>,
>(
  result: R,
  deps: D,
): TC<Γ, A, B, R, D> => transformation(result, deps, 'tc')
export const applyTC = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  D extends TCDeps<Γ, A, B>,
>(
  ...deps: D & TCDeps<Γ, A, B>
): TC<Γ, A, B, TCResult<Γ, A, B>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const a: A = tuple.last(tuple.init(dep.result.antecedent))
  const b: B = tuple.last(dep.result.antecedent)
  const δ = dep.result.succedent
  return tc(sequent([...γ, conjunction(a, b)], δ), deps)
}
export const reverseTC = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  R extends TCResult<Γ, A, B>,
>(
  p: Derivation<R>,
): TC<Γ, A, B, R, TCDeps<Γ, A, B>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
  const a: A = acb.leftConjunct
  const b: B = acb.rightConjunct
  const δ = p.result.succedent
  return tc(p.result, [premise(sequent([...γ, a, b], δ))])
}
export const tryReverseTC = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => (isTCResultDerivation(d) ? reverseTC(d) : null)
export const exampleTC = applyTC(
  premise(sequent([atom('Γ'), atom('A'), atom('B')], [verum])),
)

export const ruleTC = {
  id: 'tc',
  connectives: ['conjunction'],
  isResult: isTCResult,
  isResultDerivation: isTCResultDerivation,
  make: tc,
  apply: applyTC,
  reverse: reverseTC,
  tryReverse: tryReverseTC,
  example: exampleTC,
} satisfies Rule<AnyTCResult>
