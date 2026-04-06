import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Implication,
  isImplication,
  implication,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type FILResult<
  Γ extends Formulas,
  Δ extends Formulas,
  Σ extends Formulas,
  A extends Prop,
  B extends Prop,
  Π extends Formulas,
> = Sequent<[...Γ, ...Σ, Implication<A, B>], [...Δ, ...Π]>
export type AnyFILResult = FILResult<
  Formulas,
  Formulas,
  Formulas,
  Prop,
  Prop,
  Formulas
>
export const isFILResult: Refinement<AnySequent, AnyFILResult> = (
  s,
): s is AnyFILResult => {
  const last = s.antecedent.at(-1)
  return last !== undefined && isImplication(last)
}
export const isFILResultDerivation = refineDerivation(isFILResult)
export type FILDeps<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
> = [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Σ, B], Π>>]
export type AnyFILDeps = FILDeps<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas
>
export type FIL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FILResult<Γ, Δ, Σ, A, B, Π>,
  D extends FILDeps<Γ, A, Δ, Σ, B, Π>,
> = Transformation<R, D, 'fil'>
export type AnyFIL = FIL<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas,
  AnyFILResult,
  AnyFILDeps
>
export const fil = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FILResult<Γ, Δ, Σ, A, B, Π>,
  D extends FILDeps<Γ, A, Δ, Σ, B, Π>,
>(
  result: R,
  deps: D,
): FIL<Γ, A, Δ, Σ, B, Π, R, D> => {
  return transformation(result, deps, 'fil')
}
export const applyFIL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  D extends FILDeps<Γ, A, Δ, Σ, B, Π>,
>(
  ...deps: D & FILDeps<Γ, A, Δ, Σ, B, Π>
): FIL<Γ, A, Δ, Σ, B, Π, FILResult<Γ, Δ, Σ, A, B, Π>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = dep1.result.antecedent
  const ς: Σ = tuple.init(dep2.result.antecedent)
  const a: A = tuple.head(dep1.result.succedent)
  const b: B = tuple.last(dep2.result.antecedent)
  const δ: Δ = tuple.tail(dep1.result.succedent)
  const π: Π = dep2.result.succedent
  return fil(sequent([...γ, ...ς, implication(a, b)], [...δ, ...π]), deps)
}
export const reverseFIL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FILResult<Γ, Δ, Σ, A, B, Π>,
>(
  p: Derivation<R>,
  splitAnt: number,
  splitSuc: number,
): FIL<Γ, A, Δ, Σ, B, Π, R, FILDeps<Γ, A, Δ, Σ, B, Π>> => {
  const aib = tuple.last(p.result.antecedent) as Implication<A, B>
  const rest = tuple.init(p.result.antecedent)
  const γ = rest.slice(0, splitAnt) as unknown as Γ
  const ς = rest.slice(splitAnt) as unknown as Σ
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ = p.result.succedent.slice(0, splitSuc) as unknown as Δ
  const π = p.result.succedent.slice(splitSuc) as unknown as Π
  return fil(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent([...ς, b], π)),
  ])
}
export const tryReverseFIL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  if (!isFILResultDerivation(d)) return null
  const antLen = d.result.antecedent.length - 1
  const sucLen = d.result.succedent.length
  return reverseFIL(d, antLen, sucLen)
}
export const exampleFIL = applyFIL(
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
  premise(sequent([atom('Σ'), atom('B')], [atom('Π')])),
)

export const ruleFIL = {
  id: 'fil',
  connectives: ['implication'],
  isResult: isFILResult,
  isResultDerivation: isFILResultDerivation,
  make: fil,
  apply: applyFIL,
  reverse: reverseFIL,
  tryReverse: tryReverseFIL,
  example: exampleFIL,
} satisfies Rule<AnyFILResult>
