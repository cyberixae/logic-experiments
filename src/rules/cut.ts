import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
  premise,
} from '../model/derivation'
import { Prop, atom } from '../model/prop'
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent'
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
export type Cut<
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<Γ, [...Δ, A]>>, Derivation<Sequent<[A, ...Γ], Δ>>],
  'Cut'
>
export type AnyCut = Cut<Formulas, Formulas, Prop, AnyCutResult>
export const cut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [...Δ, A]>>, Derivation<Sequent<[A, ...Γ], Δ>>],
): Cut<Γ, Δ, A, R> => {
  return transformation(result, deps, 'Cut')
}
export type ApplyCut<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<infer Γ, [...infer Δ extends Formulas, infer A extends Prop]>
  >,
  Derivation<
    Sequent<[infer A extends Prop, ...infer Γ extends Formulas], infer Δ>
  >,
]
  ? Cut<Γ, Δ, A, CutResult<Γ, Δ>>
  : never
export const applyCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s1: Derivation<Sequent<Γ, [...Δ, A]>>,
  s2: Derivation<Sequent<[A, ...Γ], Δ>>,
): ApplyCut<
  Derivation<Sequent<Γ, [...Δ, A]>>,
  Derivation<Sequent<[A, ...Γ], Δ>>
> => {
  const γ: Γ = s1.result.antecedent
  const δ: Δ = tuple.init(s1.result.succedent)
  return cut(sequent(γ, δ), [s1, s2])
}
export const reverseCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  R extends CutResult<Γ, Δ>,
>(
  p: Derivation<R>,
  a: A,
): Cut<Γ, Δ, A, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = p.result.succedent
  return cut(p.result, [
    premise(sequent(γ, [...δ, a])),
    premise(sequent([a, ...γ], δ)),
  ])
}
export const tryReverseCut = (a: Prop) => <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
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
