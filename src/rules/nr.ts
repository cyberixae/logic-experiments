import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, Negation, isNegation, negation, atom } from '../model/prop'
import { Sequent, AnySequent, refineActiveR, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type NRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Negation<A>, ...Δ]>
export type AnyNRResult = NRResult<Formulas, Prop, Formulas>
export const isNRResult: Refinement<AnySequent, AnyNRResult> =
  refineActiveR(isNegation)
export const isNRResultDerivation = refineDerivation(isNRResult)
export type NRDeps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<[...Γ, A], Δ>>,
]
export type AnyNRDeps = NRDeps<Formulas, Prop, Formulas>
export type NR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
  D extends NRDeps<Γ, A, Δ>,
> = Transformation<R, D, 'nr'>
export type AnyNR = NR<Formulas, Prop, Formulas, AnyNRResult, AnyNRDeps>
export const nr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
  D extends NRDeps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): NR<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'nr')
}
export const applyNR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  D extends NRDeps<Γ, A, Δ>,
>(
  ...deps: D & NRDeps<Γ, A, Δ>
): NR<Γ, A, Δ, NRResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(dep.result.antecedent)
  const a: A = tuple.last(dep.result.antecedent)
  const δ: Δ = dep.result.succedent
  return nr(sequent(γ, [negation(a), ...δ]), deps)
}
export const reverseNR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NR<Γ, A, Δ, R, NRDeps<Γ, A, Δ>> => {
  const γ: Γ = p.result.antecedent
  const na: Negation<A> = tuple.head(p.result.succedent)
  const a: A = na.negand
  const δ: Δ = tuple.tail(p.result.succedent)
  return nr(p.result, [premise(sequent([...γ, a], δ))])
}
export const tryReverseNR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isNRResultDerivation(d) ? reverseNR(d) : null
}
export const exampleNR = applyNR(
  premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
)

export const ruleNR = {
  id: 'nr',
  connectives: ['negation'],
  isResult: isNRResult,
  isResultDerivation: isNRResultDerivation,
  make: nr,
  apply: applyNR,
  reverse: reverseNR,
  tryReverse: tryReverseNR,
  example: exampleNR,
} satisfies Rule<AnyNRResult>
