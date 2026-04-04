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
import { Sequent, AnySequent, refineActiveR, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type CRResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Conjunction<A, B>, ...Δ]>
export type AnyCRResult = CRResult<Formulas, Prop, Prop, Formulas>
export const isCRResult: Refinement<AnySequent, AnyCRResult> =
  refineActiveR(isConjunction)
export const isCRResultDerivation = refineDerivation(isCRResult)
export type CRDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Γ, [B, ...Δ]>>]
export type AnyCRDeps = CRDeps<Formulas, Prop, Prop, Formulas>
export type CR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
  D extends CRDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'cr'>
export type AnyCR = CR<Formulas, Prop, Prop, Formulas, AnyCRResult, AnyCRDeps>
export const cr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
  D extends CRDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): CR<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'cr')
}
export const applyCR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends CRDeps<Γ, A, B, Δ>,
>(
  ...deps: D & CRDeps<Γ, A, B, Δ>
): CR<Γ, A, B, Δ, CRResult<Γ, A, B, Δ>, D> => {
  const [dep1, dep2] = deps
  const γ: Γ = dep1.result.antecedent
  const a: A = tuple.head(dep1.result.succedent)
  const b: B = tuple.head(dep2.result.succedent)
  const δ: Δ = tuple.tail(dep1.result.succedent)
  return cr(sequent(γ, [conjunction(a, b), ...δ]), deps)
}
export const reverseCR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CR<Γ, A, B, Δ, R, CRDeps<Γ, A, B, Δ>> => {
  const γ: Γ = p.result.antecedent
  const acb: Conjunction<A, B> = tuple.head(p.result.succedent)
  const a: A = acb.leftConjunct
  const b: B = acb.rightConjunct
  const δ: Δ = tuple.tail(p.result.succedent)
  return cr(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent(γ, [b, ...δ])),
  ])
}
export const tryReverseCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCRResultDerivation(d) ? reverseCR(d) : null
}
export const exampleCR = applyCR(
  premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
  premise(sequent([atom('Γ')], [atom('B'), atom('Δ')])),
)

export const ruleCR = {
  id: 'cr',
  connectives: ['conjunction'],
  isResult: isCRResult,
  isResultDerivation: isCRResultDerivation,
  make: cr,
  apply: applyCR,
  reverse: reverseCR,
  tryReverse: tryReverseCR,
  example: exampleCR,
} satisfies Rule<AnyCRResult>
