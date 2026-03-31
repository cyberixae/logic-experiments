import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  AnyDerivation,
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
export type CR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Γ, [B, ...Δ]>>],
  'cr'
>
export type AnyCR = CR<Formulas, Prop, Prop, Formulas, AnyCRResult>
export const cr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Γ, [B, ...Δ]>>],
): CR<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cr')
}
export type ApplyCR<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >,
  Derivation<
    Sequent<infer Γ, [infer B extends Prop, ...infer Δ extends Formulas]>
  >,
]
  ? CR<Γ, A, B, Δ, CRResult<Γ, A, B, Δ>>
  : never
export const applyCR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s1: Derivation<Sequent<Γ, [A, ...Δ]>>,
  s2: Derivation<Sequent<Γ, [B, ...Δ]>>,
): ApplyCR<
  Derivation<Sequent<Γ, [A, ...Δ]>>,
  Derivation<Sequent<Γ, [B, ...Δ]>>
> => {
  const γ: Γ = s1.result.antecedent
  const a: A = tuple.head(s1.result.succedent)
  const b: B = tuple.head(s2.result.succedent)
  const δ: Δ = tuple.tail(s1.result.succedent)
  return cr(sequent(γ, [conjunction(a, b), ...δ]), [s1, s2])
}
export const reverseCR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CR<Γ, A, B, Δ, R> => {
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
  isResult: isCRResult,
  isResultDerivation: isCRResultDerivation,
  make: cr,
  apply: applyCR,
  reverse: reverseCR,
  tryReverse: tryReverseCR,
  example: exampleCR,
} satisfies Rule<AnyCRResult>
