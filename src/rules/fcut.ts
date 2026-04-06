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

export type FCutResult<
  Γ extends Formulas,
  Δ extends Formulas,
  Σ extends Formulas,
  Π extends Formulas,
> = Sequent<[...Γ, ...Σ], [...Δ, ...Π]>
export type AnyFCutResult = FCutResult<Formulas, Formulas, Formulas, Formulas>
export const isFCutResult: Refinement<AnySequent, AnyFCutResult> = (
  s,
): s is AnyFCutResult => {
  return true
}
export const isFCutResultDerivation = refineDerivation(isFCutResult)
export type FCutDeps<
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  Σ extends Formulas,
  Π extends Formulas,
> = [Derivation<Sequent<Γ, [...Δ, A]>>, Derivation<Sequent<[A, ...Σ], Π>>]
export type AnyFCutDeps = FCutDeps<Formulas, Formulas, Prop, Formulas, Formulas>
export type FCut<
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  Σ extends Formulas,
  Π extends Formulas,
  R extends FCutResult<Γ, Δ, Σ, Π>,
  D extends FCutDeps<Γ, Δ, A, Σ, Π>,
> = Transformation<R, D, 'fcut'>
export type AnyFCut = FCut<
  Formulas,
  Formulas,
  Prop,
  Formulas,
  Formulas,
  AnyFCutResult,
  AnyFCutDeps
>
export const fcut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  Σ extends Formulas,
  Π extends Formulas,
  R extends FCutResult<Γ, Δ, Σ, Π>,
  D extends FCutDeps<Γ, Δ, A, Σ, Π>,
>(
  result: R,
  deps: D,
): FCut<Γ, Δ, A, Σ, Π, R, D> => {
  return transformation(result, deps, 'fcut')
}
export const applyFCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  Σ extends Formulas,
  Π extends Formulas,
  D extends FCutDeps<Γ, Δ, A, Σ, Π>,
>(
  ...deps: D & FCutDeps<Γ, Δ, A, Σ, Π>
): FCut<Γ, Δ, A, Σ, Π, FCutResult<Γ, Δ, Σ, Π>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = dep1.result.antecedent
  const δ: Δ = tuple.init(dep1.result.succedent)
  const ς: Σ = tuple.tail(dep2.result.antecedent)
  const π: Π = dep2.result.succedent
  return fcut(sequent([...γ, ...ς], [...δ, ...π]), deps)
}
export const reverseFCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
  Σ extends Formulas,
  Π extends Formulas,
  R extends FCutResult<Γ, Δ, Σ, Π>,
>(
  p: Derivation<R>,
  a: A,
  splitAnt: (arr: [...Γ, ...Σ]) => [Γ, Σ],
  splitSuc: (arr: [...Δ, ...Π]) => [Δ, Π],
): FCut<Γ, Δ, A, Σ, Π, R, FCutDeps<Γ, Δ, A, Σ, Π>> => {
  const [γ, ς] = splitAnt(p.result.antecedent)
  const [δ, π] = splitSuc(p.result.succedent)
  return fcut(p.result, [
    premise(sequent(γ, [...δ, a])),
    premise(sequent([a, ...ς], π)),
  ])
}
export const tryReverseFCut =
  (a: Prop) =>
  <J extends AnySequent>(d: Derivation<J>): Derivation<J> | null => {
    if (!isFCutResultDerivation(d)) return null
    const antLen = d.result.antecedent.length
    const sucLen = d.result.succedent.length
    return reverseFCut(
      d,
      a,
      (arr) => [arr.slice(0, antLen), arr.slice(antLen)],
      (arr) => [arr.slice(0, sucLen), arr.slice(sucLen)],
    )
  }
export const exampleFCut = applyFCut(
  premise(sequent([atom('Γ')], [atom('Δ'), atom('A')])),
  premise(sequent([atom('A'), atom('Σ')], [atom('Π')])),
)

export const ruleFCut = {
  id: 'fcut',
  connectives: [],
  isResult: isFCutResult,
  isResultDerivation: isFCutResultDerivation,
  make: fcut,
  apply: applyFCut,
  reverse: reverseFCut,
  tryReverse: tryReverseFCut,
  example: exampleFCut,
} satisfies Rule<AnyFCutResult>
