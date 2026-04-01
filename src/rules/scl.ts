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

export type SCLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, A], Δ>
export type AnySCLResult = SCLResult<Formulas, Prop, Formulas>
export const isSCLResult: Refinement<AnySequent, AnySCLResult> = (
  s,
): s is AnySCLResult => {
  return s.antecedent.length > 0
}
export const isSCLResultDerivation = refineDerivation(isSCLResult)
export type SCLDeps<Γ extends Formulas, A extends Prop, Δ extends Formulas> = [
  Derivation<Sequent<[...Γ, A, A], Δ>>,
]
export type AnySCLDeps = SCLDeps<Formulas, Prop, Formulas>
export type SCL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
  D extends SCLDeps<Γ, A, Δ>,
> = Transformation<R, D, 'scl'>
export type AnySCL = SCL<Formulas, Prop, Formulas, AnySCLResult, AnySCLDeps>
export const scl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
  D extends SCLDeps<Γ, A, Δ>,
>(
  result: R,
  deps: D,
): SCL<Γ, A, Δ, R, D> => {
  return transformation(result, deps, 'scl')
}
export const applySCL = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  D extends SCLDeps<Γ, A, Δ>,
>(
  ...deps: D & SCLDeps<Γ, A, Δ>
): SCL<Γ, A, Δ, SCLResult<Γ, A, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(tuple.init(dep.result.antecedent))
  const a: A = tuple.last(dep.result.antecedent)
  const δ: Δ = dep.result.succedent
  return scl(sequent([...γ, a], δ), deps)
}
export const reverseSCL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SCL<Γ, A, Δ, R, SCLDeps<Γ, A, Δ>> => {
  const γ: Γ = tuple.init(p.result.antecedent)
  const a: A = tuple.last(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return scl(p.result, [premise(sequent([...γ, a, a], δ))])
}
export const tryReverseSCL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSCLResultDerivation(d) ? reverseSCL(d) : null
}
export const exampleSCL = applySCL(
  premise(sequent([atom('Γ'), atom('A'), atom('A')], [atom('Δ')])),
)

export const ruleSCL = {
  id: 'scl',
  isResult: isSCLResult,
  isResultDerivation: isSCLResultDerivation,
  make: scl,
  apply: applySCL,
  reverse: reverseSCL,
  tryReverse: tryReverseSCL,
  example: exampleSCL,
} satisfies Rule<AnySCLResult>
