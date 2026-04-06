import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Disjunction,
  isDisjunction,
  disjunction,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type FDLResult<
  Γ extends Formulas,
  Δ extends Formulas,
  Σ extends Formulas,
  A extends Prop,
  B extends Prop,
  Π extends Formulas,
> = Sequent<[...Γ, ...Σ, Disjunction<A, B>], [...Δ, ...Π]>
export type AnyFDLResult = FDLResult<
  Formulas,
  Formulas,
  Formulas,
  Prop,
  Prop,
  Formulas
>
export const isFDLResult: Refinement<AnySequent, AnyFDLResult> = (
  s,
): s is AnyFDLResult => {
  const last = s.antecedent.at(-1)
  return last !== undefined && isDisjunction(last)
}
export const isFDLResultDerivation = refineDerivation(isFDLResult)
export type FDLDeps<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
> = [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Σ, B], Π>>]
export type AnyFDLDeps = FDLDeps<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas
>
export type FDL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FDLResult<Γ, Δ, Σ, A, B, Π>,
  D extends FDLDeps<Γ, A, Δ, Σ, B, Π>,
> = Transformation<R, D, 'fdl'>
export type AnyFDL = FDL<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas,
  AnyFDLResult,
  AnyFDLDeps
>
export const fdl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FDLResult<Γ, Δ, Σ, A, B, Π>,
  D extends FDLDeps<Γ, A, Δ, Σ, B, Π>,
>(
  result: R,
  deps: D,
): FDL<Γ, A, Δ, Σ, B, Π, R, D> => {
  return transformation(result, deps, 'fdl')
}
export const applyFDL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  D extends FDLDeps<Γ, A, Δ, Σ, B, Π>,
>(
  ...deps: D & FDLDeps<Γ, A, Δ, Σ, B, Π>
): FDL<Γ, A, Δ, Σ, B, Π, FDLResult<Γ, Δ, Σ, A, B, Π>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = tuple.init(dep1.result.antecedent)
  const ς: Σ = tuple.init(dep2.result.antecedent)
  const a: A = tuple.last(dep1.result.antecedent)
  const b: B = tuple.last(dep2.result.antecedent)
  const δ: Δ = dep1.result.succedent
  const π: Π = dep2.result.succedent
  return fdl(sequent([...γ, ...ς, disjunction(a, b)], [...δ, ...π]), deps)
}
export const reverseFDL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FDLResult<Γ, Δ, Σ, A, B, Π>,
>(
  p: Derivation<R>,
  splitAnt: number,
  splitSuc: number,
): FDL<Γ, A, Δ, Σ, B, Π, R, FDLDeps<Γ, A, Δ, Σ, B, Π>> => {
  const adb = tuple.last(p.result.antecedent) as Disjunction<A, B>
  const rest = tuple.init(p.result.antecedent)
  const γ = rest.slice(0, splitAnt) as unknown as Γ
  const ς = rest.slice(splitAnt) as unknown as Σ
  const a: A = adb.leftDisjunct
  const b: B = adb.rightDisjunct
  const δ = p.result.succedent.slice(0, splitSuc) as unknown as Δ
  const π = p.result.succedent.slice(splitSuc) as unknown as Π
  return fdl(p.result, [
    premise(sequent([...γ, a], δ)),
    premise(sequent([...ς, b], π)),
  ])
}
export const tryReverseFDL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  if (!isFDLResultDerivation(d)) return null
  const antLen = d.result.antecedent.length - 1
  const sucLen = d.result.succedent.length
  return reverseFDL(d, antLen, sucLen)
}
export const exampleFDL = applyFDL(
  premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
  premise(sequent([atom('Σ'), atom('B')], [atom('Π')])),
)

export const ruleFDL = {
  id: 'fdl',
  connectives: ['disjunction'],
  isResult: isFDLResult,
  isResultDerivation: isFDLResultDerivation,
  make: fdl,
  apply: applyFDL,
  reverse: reverseFDL,
  tryReverse: tryReverseFDL,
  example: exampleFDL,
} satisfies Rule<AnyFDLResult>
