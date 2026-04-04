import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Sequent, AnySequent, isActiveR, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type SWRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, ...Δ]>
export type AnySWRResult = SWRResult<Formulas, Prop, Formulas>
export const isSWRResult: Refinement<AnySequent, AnySWRResult> = isActiveR
export const isSWRResultDerivation = refineDerivation(isSWRResult)
export type SWRDeps<Γ extends Formulas, Δ extends Formulas> = [
  Derivation<Sequent<Γ, Δ>>,
]
export type AnySWRDeps = SWRDeps<Formulas, Formulas>
export type SWR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
  D extends SWRDeps<Γ, Δ>,
> = Transformation<R, D, 'swr'>
export type AnySWR = SWR<Formulas, Prop, Formulas, AnySWRResult, AnySWRDeps>
export const swr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
  D extends SWRDeps<Γ, Δ>,
>(
  result: R,
  deps: D,
): SWR<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'swr')
}
export const applySWR = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
  D extends SWRDeps<Γ, Δ>,
>(
  a: A,
  ...deps: D & SWRDeps<Γ, Δ>
): SWR<Γ, A, Δ, SWRResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ: Δ = dep.result.succedent
  return swr(sequent(γ, [a, ...δ]), deps)
}
export const reverseSWR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SWR<Γ, A, Δ, R, SWRDeps<Γ, Δ>> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = tuple.tail(p.result.succedent)
  return swr(p.result, [premise(sequent(γ, δ))])
}
export const tryReverseSWR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSWRResultDerivation(d) ? reverseSWR(d) : null
}
export const exampleSWR = applySWR(
  atom('A'),
  premise(sequent([atom('Γ')], [atom('Δ')])),
)

export const ruleSWR = {
  id: 'swr',
  connectives: [],
  isResult: isSWRResult,
  isResultDerivation: isSWRResultDerivation,
  make: swr,
  apply: applySWR,
  reverse: reverseSWR,
  tryReverse: tryReverseSWR,
  example: exampleSWR,
} satisfies Rule<AnySWRResult>
