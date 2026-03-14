import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import {
  Formulas,
  Sequent,
  AnySequent,
  isActiveR,
  sequent,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type SCRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, ...Δ]>
export type AnySCRResult = SCRResult<Formulas, Prop, Formulas>
export const isSCRResult: Refinement<AnySequent, AnySCRResult> = isActiveR
export const isSCRResultDerivation = refineDerivation(isSCRResult)
export type SCR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, A, ...Δ]>>], 'scr'>
export type AnySCR = SCR<Formulas, Prop, Formulas, AnySCRResult>
export const scr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, A, ...Δ]>>],
): SCR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'scr')
}
export type ApplySCR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer A extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SCR<Γ, A, Δ, SCRResult<Γ, A, Δ>>
    : never
export const applySCR = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<Γ, [A, A, ...Δ]>>,
): ApplySCR<Derivation<Sequent<Γ, [A, A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = tuple.head(s.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  return scr(sequent(γ, [a, ...δ]), [s])
}
export const reverseSCR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SCR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const a: A = tuple.head(p.result.succedent)
  const δ: Δ = tuple.tail(p.result.succedent)
  return scr(p.result, [premise(sequent(γ, [a, a, ...δ]))])
}
export const tryReverseSCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSCRResultDerivation(d) ? reverseSCR(d) : null
}
export const exampleSCR = applySCR(
  premise(sequent([atom('Γ')], [atom('A'), atom('A'), atom('Δ')])),
)

export const ruleSCR = {
  isResult: isSCRResult,
  isResultDerivation: isSCRResultDerivation,
  make: scr,
  apply: applySCR,
  reverse: reverseSCR,
  tryReverse: tryReverseSCR,
  example: exampleSCR,
} satisfies Rule<AnySCRResult>
