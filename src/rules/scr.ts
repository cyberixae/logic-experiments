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

export type SCRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, ...Δ]>
export type AnySCRResult = SCRResult<Formulas, Prop, Formulas>
export const isSCRResult: Refinement<AnySequent, AnySCRResult> = isActiveR
export const isSCRResultDerivation = refineDerivation(isSCRResult)
export type SCRDeps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<Γ, [A, A, ...Δ]>>,
]
export type AnySCRDeps = SCRDeps<Formulas, Prop, Formulas>
export type SCR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
  D extends SCRDeps<Γ, A, Δ>,
> = Transformation<R, D, 'scr'>
export type AnySCR = SCR<Formulas, Prop, Formulas, AnySCRResult, AnySCRDeps>
export const scr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
  D extends SCRDeps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): SCR<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'scr')
}
export const applySCR = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  D extends SCRDeps<Γ, A, Δ>,
>(
  ...deps: D & SCRDeps<Γ, A, Δ>
): SCR<Γ, A, Δ, SCRResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const a: A = tuple.head(dep.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(dep.result.succedent))
  return scr(sequent(γ, [a, ...δ]), deps)
}
export const reverseSCR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SCR<Γ, A, Δ, R, SCRDeps<Γ, A, Δ>> => {
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
  id: 'scr',
  isResult: isSCRResult,
  isResultDerivation: isSCRResultDerivation,
  make: scr,
  apply: applySCR,
  reverse: reverseSCR,
  tryReverse: tryReverseSCR,
  example: exampleSCR,
} satisfies Rule<AnySCRResult>
