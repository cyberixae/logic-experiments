import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Conjunction,
  isConjunction,
  conjunction,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type FCRResult<
  Γ extends Formulas,
  Δ extends Formulas,
  Σ extends Formulas,
  A extends Prop,
  B extends Prop,
  Π extends Formulas,
> = Sequent<[...Γ, ...Σ], [Conjunction<A, B>, ...Δ, ...Π]>
export type AnyFCRResult = FCRResult<
  Formulas,
  Formulas,
  Formulas,
  Prop,
  Prop,
  Formulas
>
export const isFCRResult: Refinement<AnySequent, AnyFCRResult> = (
  s,
): s is AnyFCRResult => {
  const first = s.succedent.at(0)
  return first !== undefined && isConjunction(first)
}
export const isFCRResultDerivation = refineDerivation(isFCRResult)
export type FCRDeps<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
> = [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Σ, [B, ...Π]>>]
export type AnyFCRDeps = FCRDeps<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas
>
export type FCR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FCRResult<Γ, Δ, Σ, A, B, Π>,
  D extends FCRDeps<Γ, A, Δ, Σ, B, Π>,
> = Transformation<R, D, 'fcr'>
export type AnyFCR = FCR<
  Formulas,
  Prop,
  Formulas,
  Formulas,
  Prop,
  Formulas,
  AnyFCRResult,
  AnyFCRDeps
>
export const fcr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FCRResult<Γ, Δ, Σ, A, B, Π>,
  D extends FCRDeps<Γ, A, Δ, Σ, B, Π>,
>(
  result: R,
  deps: D,
): FCR<Γ, A, Δ, Σ, B, Π, R, D> => {
  return transformation(result, deps, 'fcr')
}
export const applyFCR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  D extends FCRDeps<Γ, A, Δ, Σ, B, Π>,
>(
  ...deps: D & FCRDeps<Γ, A, Δ, Σ, B, Π>
): FCR<Γ, A, Δ, Σ, B, Π, FCRResult<Γ, Δ, Σ, A, B, Π>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = dep1.result.antecedent
  const ς: Σ = dep2.result.antecedent
  const a: A = tuple.head(dep1.result.succedent)
  const b: B = tuple.head(dep2.result.succedent)
  const δ: Δ = tuple.tail(dep1.result.succedent)
  const π: Π = tuple.tail(dep2.result.succedent)
  return fcr(sequent([...γ, ...ς], [conjunction(a, b), ...δ, ...π]), deps)
}
export const reverseFCR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
  R extends FCRResult<Γ, Δ, Σ, A, B, Π>,
>(
  p: Derivation<R>,
  splitAnt: number,
  splitSuc: number,
): FCR<Γ, A, Δ, Σ, B, Π, R, FCRDeps<Γ, A, Δ, Σ, B, Π>> => {
  const acb = tuple.head(p.result.succedent) as Conjunction<A, B>
  const rest = tuple.tail(p.result.succedent)
  const γ = p.result.antecedent.slice(0, splitAnt) as unknown as Γ
  const ς = p.result.antecedent.slice(splitAnt) as unknown as Σ
  const a: A = acb.leftConjunct
  const b: B = acb.rightConjunct
  const δ = rest.slice(0, splitSuc) as unknown as Δ
  const π = rest.slice(splitSuc) as unknown as Π
  return fcr(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent(ς, [b, ...π])),
  ])
}
export const tryReverseFCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  if (!isFCRResultDerivation(d)) return null
  const antLen = d.result.antecedent.length
  const sucLen = d.result.succedent.length - 1
  return reverseFCR(d, antLen, sucLen)
}
export const exampleFCR = applyFCR(
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
  premise(sequent([atom('Σ')], [atom('B'), atom('Π')])),
)

export const ruleFCR = {
  id: 'fcr',
  connectives: ['conjunction'],
  isResult: isFCRResult,
  isResultDerivation: isFCRResultDerivation,
  make: fcr,
  apply: applyFCR,
  reverse: reverseFCR,
  tryReverse: tryReverseFCR,
  example: exampleFCR,
} satisfies Rule<AnyFCRResult>
