import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
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
export type SWR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, Δ>>], 'swr'>
export type AnySWR = SWR<Formulas, Prop, Formulas, AnySWRResult>
export const swr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, Δ>>],
): SWR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'swr')
}
export type ApplySWR<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<Sequent<infer Γ, infer Δ>>
    ? SWR<Γ, A, Δ, SWRResult<Γ, A, Δ>>
    : never
export const applySWR = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>,
): ApplySWR<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = s.result.succedent
  return swr(sequent(γ, [a, ...δ]), [s])
}
export const reverseSWR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SWR<Γ, A, Δ, R> => {
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
  isResult: isSWRResult,
  isResultDerivation: isSWRResultDerivation,
  make: swr,
  apply: applySWR,
  reverse: reverseSWR,
  tryReverse: tryReverseSWR,
  example: exampleSWR,
} satisfies Rule<AnySWRResult>
