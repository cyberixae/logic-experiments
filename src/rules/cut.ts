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

export type CutResult<Γ extends Formulas, Δ extends Formulas> = Sequent<Γ, Δ>
export type AnyCutResult = CutResult<Formulas, Formulas>
export const isCutResult: Refinement<AnySequent, AnyCutResult> = (
  s,
): s is AnyCutResult => {
  return true
}
export const isCutResultDerivation = refineDerivation(isCutResult)
export type CutDeps<Γ extends Formulas, Δ extends Formulas, A extends Prop> = [
  Derivation<Sequent<Γ, [...Δ, A]>>,
  Derivation<Sequent<[A, ...Γ], Δ>>,
]
export type AnyCutDeps = CutDeps<Formulas, Formulas, Prop>
export type Cut<
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
  D extends CutDeps<Γ, Δ, A>,
> = Transformation<R, D, 'Cut'>
export type AnyCut = Cut<Formulas, Formulas, Prop, AnyCutResult, AnyCutDeps>
export const cut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
  D extends CutDeps<Γ, Δ, A>,
>(
  result: R,
  deps: D,
): Cut<Γ, Δ, A, R, D> => {
  return transformation(result, deps, 'Cut')
}
export const applyCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  D extends CutDeps<Γ, Δ, A>,
>(
  ...deps: D & CutDeps<Γ, Δ, A>
): Cut<Γ, Δ, A, CutResult<Γ, Δ>, D> => {
  const [dep1] = deps
  const γ: Γ = dep1.result.antecedent
  const δ: Δ = tuple.init(dep1.result.succedent)
  return cut(sequent(γ, δ), deps)
}
export const reverseCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
>(
  p: Derivation<R>,
  a: A,
): Cut<Γ, Δ, A, R, CutDeps<Γ, Δ, A>> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = p.result.succedent
  return cut(p.result, [
    premise(sequent(γ, [...δ, a])),
    premise(sequent([a, ...γ], δ)),
  ])
}
export const tryReverseCut =
  (a: Prop) =>
  <J extends AnySequent>(d: Derivation<J>): Derivation<J> | null => {
    return isCutResultDerivation(d) ? reverseCut(d, a) : null
  }
export const exampleCut = applyCut(
  premise(sequent([atom('Γ')], [atom('Δ'), atom('A')])),
  premise(sequent([atom('A'), atom('Γ')], [atom('Δ')])),
)

export const ruleCut = {
  id: 'cut',
  isResult: isCutResult,
  isResultDerivation: isCutResultDerivation,
  make: cut,
  apply: applyCut,
  reverse: reverseCut,
  tryReverse: tryReverseCut,
  example: exampleCut,
} satisfies Rule<AnyCutResult>
