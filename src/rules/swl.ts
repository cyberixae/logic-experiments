import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type SWLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, A], Δ>
export type AnySWLResult = SWLResult<Formulas, Prop, Formulas>
export const isSWLResult: Refinement<AnySequent, AnySWLResult> = (
  s,
): s is AnySWLResult => {
  return s.antecedent.length > 0
}
export const isSWLResultDerivation = refineDerivation(isSWLResult)
export type SWLDeps<Γ extends Formulas, Δ extends Formulas> = [
  Derivation<Sequent<Γ, Δ>>,
]
export type AnySWLDeps = SWLDeps<Formulas, Formulas>
export type SWL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
  D extends SWLDeps<Γ, Δ>,
> = Transformation<R, D, 'swl'>
export type AnySWL = SWL<Formulas, Prop, Formulas, AnySWLResult, AnySWLDeps>
export const swl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
  D extends SWLDeps<Γ, Δ>,
>(
  result: R,
  deps: D,
): SWL<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'swl')
}
export const applySWL = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
  D extends SWLDeps<Γ, Δ>,
>(
  a: A,
  ...deps: D & SWLDeps<Γ, Δ>
): SWL<Γ, A, Δ, SWLResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = dep.result.antecedent
  const δ: Δ = dep.result.succedent
  return swl(sequent([...γ, a], δ), deps)
}
export const reverseSWL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SWL<Γ, A, Δ, R, SWLDeps<Γ, Δ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return swl(p.result, [premise(sequent(γ, δ))])
}
export const tryReverseSWL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSWLResultDerivation(d) ? reverseSWL(d) : null
}
export const exampleSWL = applySWL(
  atom('A'),
  premise(sequent([atom('Γ')], [atom('Δ')])),
)

export const ruleSWL = {
  id: 'swl',
  connectives: [],
  isResult: isSWLResult,
  isResultDerivation: isSWLResultDerivation,
  make: swl,
  apply: applySWL,
  reverse: reverseSWL,
  tryReverse: tryReverseSWL,
  example: exampleSWL,
} satisfies Rule<AnySWLResult>
