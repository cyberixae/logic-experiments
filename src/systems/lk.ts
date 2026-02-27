import * as prop from '../lib/prop'
import * as array from '../lib/array'
import * as utils from '../lib/utils'
import * as print from '../lib/print'
import {
  Formulas,
  Judgement as Sequent,
  judgement as sequent,
  AnyJudgement as AnySequent,
} from '../lib/judgement'
import {
  AnyDerivation,
  Derivation,
  Introduction,
  transformation,
  introduction,
  Transformation,
  premise,
  Premise,
  Refinement,
  refinePremise,
} from '../lib/derivation'

// Connectives

export interface Atom<V extends string> extends prop.Atom<V> {}
export const atom = prop.atom

export interface Negation<N extends Prop> extends prop.Negation<N> {}
export const negation = <N extends Prop>(n: N): Negation<N> => prop.negation(n)

export interface Implication<A extends Prop, C extends Prop>
  extends prop.Implication<A, C> {}
export const implication = <A extends Prop, C extends Prop>(
  a: A,
  c: C,
): Implication<A, C> => prop.implication(a, c)

export interface Conjunction<L extends Prop, R extends Prop>
  extends prop.Conjunction<L, R> {}
export const conjunction = <L extends Prop, R extends Prop>(
  l: L,
  r: R,
): Conjunction<L, R> => prop.conjunction(l, r)

export interface Disjunction<L extends Prop, R extends Prop>
  extends prop.Disjunction<L, R> {}
export const disjunction = <L extends Prop, R extends Prop>(
  l: L,
  r: R,
): Disjunction<L, R> => prop.disjunction(l, r)

export type Prop =
  | Atom<string>
  | Negation<Prop>
  | Implication<Prop, Prop>
  | Conjunction<Prop, Prop>
  | Disjunction<Prop, Prop>

// Axiom

export type I<A extends Prop> = Introduction<Sequent<[A], [A]>, 'I'>
export type AnyI = I<Prop>
export const i = <A extends Prop>(result: Sequent<[NoInfer<A>], [A]>): I<A> =>
  introduction(result, 'I')
export type AnyIResult = AnyI['result']
export const isIResult: Refinement<AnySequent, AnyIResult> = (
  s,
): s is AnyIResult => {
  return (
    array.isTupleOf1(s.antecedent) &&
    array.isTupleOf1(s.succedent) &&
    prop.equals(s.antecedent[0], s.succedent[0])
  )
}
export const isIResultPremise = refinePremise(isIResult)
export type ApplyI<A extends Prop> = I<A>
export const applyI = <A extends Prop>(a: A): ApplyI<A> => i(sequent([a], [a]))
export const reverseI = <A extends Prop>(p: Premise<I<A>['result']>): I<A> => {
  return i(p.result)
}

// Cut

export type Cut<
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
> = Transformation<
  Sequent<Γ, Δ>,
  [Derivation<Sequent<Γ, [...Δ, A]>>, Derivation<Sequent<[A, ...Γ], Δ>>],
  'Cut'
>
export type AnyCut = Cut<Formulas, Formulas, Prop>
export const cut = <Γ extends Formulas, Δ extends Formulas, A extends Prop>(
  result: Sequent<Γ, Δ>,
  deps: [Derivation<Sequent<Γ, [...Δ, A]>>, Derivation<Sequent<[A, ...Γ], Δ>>],
): Cut<Γ, Δ, A> => {
  return transformation(result, deps, 'Cut')
}
export type AnyCutResult = AnyCut['result']
export const isCutResult: Refinement<AnySequent, AnyCutResult> = (
  s,
): s is AnyCutResult => {
  return true
}
export const isCutResultPremise = refinePremise(isCutResult)
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
  ? Cut<Γ, Δ, A>
  : never
export const applyCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s1: Derivation<Sequent<Γ, [...Δ, NoInfer<A>]>>,
  s2: Derivation<Sequent<[A, ...Γ], Δ>>,
): ApplyCut<
  Derivation<Sequent<Γ, [...Δ, A]>>,
  Derivation<Sequent<[A, ...Γ], Δ>>
> => {
  const γ: Γ = s1.result.antecedent
  const δ: Δ = array.init(s1.result.succedent)
  return cut(sequent(γ, δ), [s1, s2])
}
export const reverseCut = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  p: Premise<Cut<Γ, Δ, A>['result']>,
  a: A,
): Cut<Γ, Δ, A> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = p.result.succedent
  return cut(p.result, [
    premise(sequent(γ, [...δ, a])),
    premise(sequent([a, ...γ], δ)),
  ])
}

// Conjunction & Disjunction

export type CL1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, Conjunction<A, B>], Δ>,
  [Derivation<Sequent<[...Γ, A], Δ>>],
  'cl1'
>
export type AnyCL1 = CL1<Formulas, Prop, Prop, Formulas>
export const cl1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  result: Sequent<[...Γ, Conjunction<A, B>], Δ>,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>],
): CL1<Γ, A, B, Δ> => {
  return transformation(result, deps, 'cl1')
}

export type AnyCL1Result = AnyCL1['result']
export const isCL1Result: Refinement<AnySequent, AnyCL1Result> = (
  s,
): s is AnyCL1Result => {
  return s.antecedent.at(-1)?.kind === 'conjunction'
}
export const isCL1ResultPremise = refinePremise(isCL1Result)
export type ApplyCL1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? CL1<Γ, A, B, Δ>
    : never
export const applyCL1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): ApplyCL1<B, Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return cl1(sequent([...γ, conjunction(a, b)], δ), [s])
}
export const reverseCL1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  p: Premise<CL1<Γ, A, B, Δ>['result']>,
): CL1<Γ, A, B, Δ> => {
  const γ: Γ = array.init(p.result.antecedent)
  const acb: Conjunction<A, B> = array.last(p.result.antecedent)
  const a: A = acb.leftConjunct
  const δ: Δ = p.result.succedent
  return cl1(p.result, [premise(sequent([...γ, a], δ))])
}

export type DR1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [Disjunction<A, B>, ...Δ]>,
  [Derivation<Sequent<Γ, [A, ...Δ]>>],
  'dr1'
>
export type ApplyDR1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR1<Γ, A, B, Δ>
    : never
export const applyDR1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplyDR1<B, Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const a: A = array.head(s.result.succedent)
  return transformation(sequent(γ, [disjunction(a, b), ...δ]), [s], 'dr1')
}

export type CL2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, Conjunction<A, B>], Δ>,
  [Derivation<Sequent<[...Γ, B], Δ>>],
  'cl2'
>
export type ApplyCL2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >
    ? CL2<Γ, A, B, Δ>
    : never
export const applyCL2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyCL2<A, Derivation<Sequent<[...Γ, B], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const b: B = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, conjunction(a, b)], δ), [s], 'cl2')
}

export type DR2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [Disjunction<A, B>, ...Δ]>,
  [Derivation<Sequent<Γ, [B, ...Δ]>>],
  'dr2'
>
export type ApplyDR2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer B extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR2<Γ, A, B, Δ>
    : never
export const applyDR2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, [B, ...Δ]>>,
): ApplyDR2<A, Derivation<Sequent<Γ, [B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const b: B = array.head(s.result.succedent)
  return transformation(sequent(γ, [disjunction(a, b), ...δ]), [s], 'dr2')
}

export type DL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, Disjunction<A, B>], Δ>,
  [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'dl'
>
export const dl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  result: Sequent<[...Γ, Disjunction<A, B>], Δ>,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
): DL<Γ, A, B, Δ> => {
  return transformation(result, deps, 'dl')
}
export type ApplyDL<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >,
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >,
]
  ? DL<Γ, A, B, Δ>
  : never
export const applyDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s1: Derivation<Sequent<[...Γ, A], Δ>>,
  s2: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyDL<
  Derivation<Sequent<[...Γ, A], Δ>>,
  Derivation<Sequent<[...Γ, B], Δ>>
> => {
  const γ: Γ = array.init(s1.result.antecedent)
  const a: A = array.last(s1.result.antecedent)
  const b: B = array.last(s2.result.antecedent)
  const δ: Δ = s1.result.succedent
  return dl(sequent([...γ, disjunction(a, b)], δ), [s1, s2])
}

export type CR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [Conjunction<A, B>, ...Δ]>,
  [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Γ, [B, ...Δ]>>],
  'cr'
>
export type AnyCR = CR<Formulas, Prop, Prop, Formulas>
export const cr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  result: Sequent<Γ, [Conjunction<A, B>, ...Δ]>,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Γ, [B, ...Δ]>>],
): CR<Γ, A, B, Δ> => {
  return transformation(result, deps, 'cr')
}
export type AnyCRResult = AnyCR['result']
export const isCRResult: Refinement<AnySequent, AnyCRResult> = (
  s,
): s is AnyCRResult => {
  return s.succedent.at(0)?.kind === 'conjunction'
}
export const isCRResultPremise = refinePremise(isCRResult)
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
  ? CR<Γ, A, B, Δ>
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
  const a: A = array.head(s1.result.succedent)
  const b: B = array.head(s2.result.succedent)
  const δ: Δ = array.tail(s1.result.succedent)
  return cr(sequent(γ, [conjunction(a, b), ...δ]), [s1, s2])
}
export const reverseCR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  p: Premise<CR<Γ, A, B, Δ>['result']>,
): CR<Γ, A, B, Δ> => {
  const γ: Γ = p.result.antecedent
  const acb: Conjunction<A, B> = array.head(p.result.succedent)
  const a: A = acb.leftConjunct
  const b: B = acb.rightConjunct
  const δ: Δ = array.tail(p.result.succedent)
  return cr(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent(γ, [b, ...δ])),
  ])
}

// Implication

export type IL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, Implication<A, B>], Δ>,
  [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'il'
>
export const il = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  result: Sequent<[...Γ, Implication<A, B>], Δ>,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
): IL<Γ, A, B, Δ> => {
  return transformation(result, deps, 'il')
}
export type ApplyIL<S1 extends AnyDerivation, S2 extends AnyDerivation> = [
  S1,
  S2,
] extends [
  Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >,
  Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >,
]
  ? IL<Γ, A, B, Δ>
  : never
export const applyIL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  B extends Prop,
>(
  s1: Derivation<Sequent<Γ, [A, ...Δ]>>,
  s2: Derivation<Sequent<[...Γ, B], Δ>>,
): ApplyIL<
  Derivation<Sequent<Γ, [A, ...Δ]>>,
  Derivation<Sequent<[...Γ, B], Δ>>
> => {
  const γ: Γ = s1.result.antecedent
  const a: A = array.head(s1.result.succedent)
  const b: B = array.last(s2.result.antecedent)
  const δ: Δ = array.tail(s1.result.succedent)
  return il(sequent([...γ, implication(a, b)], δ), [s1, s2])
}

export type IR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [Implication<A, B>, ...Δ]>,
  [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>],
  'ir'
>
export type ApplyIR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop],
      [infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? IR<Γ, A, B, Δ>
    : never
export const applyIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A], [B, ...Δ]>>,
): ApplyIR<Derivation<Sequent<[...Γ, A], [B, ...Δ]>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const b: B = array.head(s.result.succedent)
  const δ: Δ = array.tail(s.result.succedent)
  return transformation(sequent(γ, [implication(a, b), ...δ]), [s], 'ir')
}

// Negation

export type NL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, Negation<A>], Δ>,
  [Derivation<Sequent<Γ, [A, ...Δ]>>],
  'nl'
>
export type ApplyNL<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? NL<Γ, A, Δ>
    : never
export const applyNL = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplyNL<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = array.head(s.result.succedent)
  const δ: Δ = array.tail(s.result.succedent)
  return transformation(sequent([...γ, negation(a)], δ), [s], 'nl')
}

export type NR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [Negation<A>, ...Δ]>,
  [Derivation<Sequent<[...Γ, A], Δ>>],
  'nr'
>
export type ApplyNR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? NR<Γ, A, Δ>
    : never

export const applyNR = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): ApplyNR<Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent(γ, [negation(a), ...δ]), [s], 'nr')
}

// Weakening

export type SWL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<Sequent<[...Γ, A], Δ>, [Derivation<Sequent<Γ, Δ>>], 'swl'>
export type ApplySWL<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<Sequent<infer Γ, infer Δ>> ? SWL<Γ, A, Δ> : never
export const applySWL = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>,
): ApplySWL<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'swl')
}

export type SWR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<Sequent<Γ, [A, ...Δ]>, [Derivation<Sequent<Γ, Δ>>], 'swr'>
export type ApplySWR<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<Sequent<infer Γ, infer Δ>> ? SWR<Γ, A, Δ> : never
export const applySWR = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>,
): ApplySWR<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = s.result.succedent
  return transformation(sequent(γ, [a, ...δ]), [s], 'swr')
}

// Contraction

export type SCL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, A], Δ>,
  [Derivation<Sequent<[...Γ, A, A], Δ>>],
  'scl'
>
export type ApplySCL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer A extends Prop],
      infer Δ
    >
  >
    ? SCL<Γ, A, Δ>
    : never
export const applySCL = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<[...Γ, A, A], Δ>>,
): ApplySCL<Derivation<Sequent<[...Γ, A, A], Δ>>> => {
  const γ: Γ = array.init(array.init(s.result.antecedent))
  const a1: A = array.last(s.result.antecedent)
  const a2: A = array.last(array.init(s.result.antecedent))
  const a: A = utils.assertEqual(a1, a2)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'scl')
}

export type SCR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [A, ...Δ]>,
  [Derivation<Sequent<Γ, [A, A, ...Δ]>>],
  'scr'
>
export type ApplySCR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer A extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SCR<Γ, A, Δ>
    : never
export const applySCR = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<Γ, [A, A, ...Δ]>>,
): ApplySCR<Derivation<Sequent<Γ, [A, A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a1: A = array.head(s.result.succedent)
  const a2: A = array.head(array.tail(s.result.succedent))
  const a: A = utils.assertEqual(a1, a2)
  const δ: Δ = array.tail(array.tail(s.result.succedent))
  return transformation(sequent(γ, [a, ...δ]), [s], 'scr')
}

// Permutation

export type SRotL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, A], Δ>,
  [Derivation<Sequent<[A, ...Γ], Δ>>],
  'srotl'
>
export type ApplySRotL<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<[infer A extends Prop, ...infer Γ extends Formulas], infer Δ>
  >
    ? Sequent<[...Γ, A], Δ>
    : never,
  [S],
  'srotl'
>
export const applySRotL = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[A, ...Γ], Δ>>,
): ApplySRotL<Derivation<Sequent<[A, ...Γ], Δ>>> => {
  const γ: Γ = array.tail(s.result.antecedent)
  const a: A = array.head(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'srotl')
}

export type SRotR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [...Δ, A]>,
  [Derivation<Sequent<Γ, [A, ...Δ]>>],
  'srotr'
>
export type ApplySRotR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? SRotR<Γ, A, Δ>
    : never
export const applySRotR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplySRotR<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const a: A = array.head(s.result.succedent)
  return transformation(sequent(γ, [...δ, a]), [s], 'srotr')
}

export type SSwpL<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<[...Γ, B, A], Δ>,
  [Derivation<Sequent<[...Γ, A, B], Δ>>],
  'sswpl'
>
export type ApplySSwpL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop],
      infer Δ
    >
  >
    ? SSwpL<Γ, B, A, Δ>
    : never
export const applySSwpL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A, B], Δ>>,
): ApplySSwpL<Derivation<Sequent<[...Γ, A, B], Δ>>> => {
  const γ: Γ = array.init(array.init(s.result.antecedent))
  const b: B = array.last(s.result.antecedent)
  const a: A = array.last(array.init(s.result.antecedent))
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, b, a], δ), [s], 'sswpl')
}

export type SSwpR<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Transformation<
  Sequent<Γ, [B, A, ...Δ]>,
  [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
  'sswpr'
>
export type ApplySSwpR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SSwpR<Γ, B, A, Δ>
    : never
export const applySSwpR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplySSwpR<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const b: B = array.head(array.tail(s.result.succedent))
  const a: A = array.head(s.result.succedent)
  const δ: Δ = array.tail(array.tail(s.result.succedent))
  return transformation(sequent(γ, [b, a, ...δ]), [s], 'sswpr')
}

// Language

const alpha = <S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`>(
  s: S,
): Atom<S> => atom(s)
const omega = {
  p0: {},
  p1: { negation },
  p2: { implication, conjunction, disjunction },
}
const iota = {
  i,
}
const zeta = {
  cut: applyCut,
  cl1: applyCL1,
  dr1: applyDR1,
  cl2: applyCL2,
  dr2: applyDR2,
  dl: applyDL,
  cr: applyCR,
  il: applyIL,
  ir: applyIR,
  nl: applyNL,
  nr: applyNR,
  swl: applySWL,
  swr: applySWR,
  scl: applySCL,
  scr: applySCR,
  srotl: applySRotL,
  srotr: applySRotR,
  sswpl: applySSwpL,
  sswpr: applySSwpR,
}

export const meta = {
  name: 'Gentzen LK',
  propositions: [
    {
      title: 'Variables',
      examples: [
        [
          alpha('p'),
          alpha('q'),
          alpha('r'),
          alpha('s'),
          alpha('t'),
          alpha('u'),
        ],
      ],
    },
    {
      title: 'Connectives',
      examples: [
        [
          negation(atom('A')),
          implication(atom('A'), atom('B')),
          conjunction(atom('A'), atom('B')),
          disjunction(atom('A'), atom('B')),
        ],
      ],
    },
  ],
  rules: [
    {
      title: 'Axiom',
      examples: [[applyI(atom('A'))]],
    },
    {
      title: 'Cut',
      examples: [
        [
          applyCut(
            premise(sequent([atom('Γ')], [atom('Δ'), atom('A')])),
            premise(sequent([atom('A'), atom('Γ')], [atom('Δ')])),
          ),
        ],
      ],
    },
    {
      title: 'Logical Rules',
      examples: [
        [
          applyCL1(
            atom('B'),
            premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
          ),
          applyDR1(
            atom('B'),
            premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
          ),
        ],
        [
          applyCL2(
            atom('A'),
            premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
          applyDR2(
            atom('A'),
            premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
        ],
        [
          applyDL(
            premise(sequent([atom('Γ'), atom('A')], [atom('Δ')])),
            premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
          applyCR(
            premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
            premise(sequent([atom('Γ')], [atom('B'), atom('Δ')])),
          ),
        ],
        [
          applyIL(
            premise(sequent([atom('Γ')], [atom('A'), atom('Δ')])),
            premise(sequent([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
          applyIR(
            premise(sequent([atom('Γ'), atom('A')], [atom('B'), atom('Δ')])),
          ),
        ],
        [
          applyNL(premise(sequent([atom('Γ')], [atom('A'), atom('Δ')]))),
          applyNR(premise(sequent([atom('Γ'), atom('A')], [atom('Δ')]))),
        ],
      ],
    },
    {
      title: 'Structural Rules',
      examples: [
        [
          applySWL(atom('A'), premise(sequent([atom('Γ')], [atom('Δ')]))),
          applySWR(atom('A'), premise(sequent([atom('Γ')], [atom('Δ')]))),
        ],
        [
          applySCL(
            premise(sequent([atom('Γ'), atom('A'), atom('A')], [atom('Δ')])),
          ),
          applySCR(
            premise(sequent([atom('Γ')], [atom('A'), atom('A'), atom('Δ')])),
          ),
        ],
        [
          applySRotL(premise(sequent([atom('Σ'), atom('A')], [atom('Π')]))),
          applySRotR(premise(sequent([atom('Σ')], [atom('A'), atom('Π')]))),
        ],
        [
          applySSwpL(
            premise(sequent([atom('Σ'), atom('A'), atom('B')], [atom('Π')])),
          ),
          applySSwpR(
            premise(sequent([atom('Σ')], [atom('A'), atom('B'), atom('Π')])),
          ),
        ],
      ],
    },
  ],
} as const

export const usage = print.fromMeta(meta)

export const lk = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}
