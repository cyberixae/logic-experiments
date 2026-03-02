import * as prop from '../lib/prop'
import * as array from '../lib/array'
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
  refineDerivation,
  isProof,
  toProof,
} from '../lib/derivation'
import { Refinement } from '../lib/generic'

// Connectives

export interface Atom<V extends string> extends prop.Atom<V> {}
export const atom = prop.atom
export const isAtom = (p: Prop): p is Atom<string> => p.kind === 'atom'

export interface Negation<N extends Prop> extends prop.Negation<N> {}
export const negation = <N extends Prop>(n: N): Negation<N> => prop.negation(n)
export const isNegation = (p: Prop): p is Negation<Prop> =>
  p.kind === 'negation'

export interface Implication<A extends Prop, C extends Prop>
  extends prop.Implication<A, C> {}
export const implication = <A extends Prop, C extends Prop>(
  a: A,
  c: C,
): Implication<A, C> => prop.implication(a, c)
export const isImplication = (p: Prop): p is Implication<Prop, Prop> =>
  p.kind === 'implication'

export interface Conjunction<L extends Prop, R extends Prop>
  extends prop.Conjunction<L, R> {}
export const conjunction = <L extends Prop, R extends Prop>(
  l: L,
  r: R,
): Conjunction<L, R> => prop.conjunction(l, r)
export const isConjunction = (p: Prop): p is Conjunction<Prop, Prop> =>
  p.kind === 'conjunction'

export interface Disjunction<L extends Prop, R extends Prop>
  extends prop.Disjunction<L, R> {}
export const disjunction = <L extends Prop, R extends Prop>(
  l: L,
  r: R,
): Disjunction<L, R> => prop.disjunction(l, r)
export const isDisjunction = (p: Prop): p is Disjunction<Prop, Prop> =>
  p.kind === 'disjunction'

export type Prop =
  | Atom<string>
  | Negation<Prop>
  | Implication<Prop, Prop>
  | Conjunction<Prop, Prop>
  | Disjunction<Prop, Prop>

// TODO: generalize the following for use with LA3

export type ActiveL<B extends Prop> = Sequent<[...Formulas, B], Formulas>
export const isActiveL = (j: AnySequent): j is ActiveL<Prop> => {
  return array.isNonEmptyArray(j.antecedent)
}
export const refineActiveL =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is ActiveL<B> => {
    return isActiveL(j) && r(array.last(j.antecedent))
  }

export type ActiveR<B extends Prop> = Sequent<Formulas, [B, ...Formulas]>
export const isActiveR = (j: AnySequent): j is ActiveR<Prop> => {
  return array.isNonEmptyArray(j.succedent)
}
export const refineActiveR =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is ActiveR<B> => {
    return isActiveR(j) && r(array.head(j.succedent))
  }

// Axiom

export type IResult<A extends Prop> = Sequent<[A], [A]>
export type AnyIResult = IResult<Prop>
export const isIResult: Refinement<AnySequent, AnyIResult> = (
  s,
): s is AnyIResult => {
  return (
    array.isTupleOf1(s.antecedent) &&
    array.isTupleOf1(s.succedent) &&
    prop.equals(s.antecedent[0], s.succedent[0])
  )
}
export const isIResultDerivation = refineDerivation(isIResult)
export type I<A extends Prop, R extends IResult<A>> = Introduction<R, 'I'>
export type AnyI = I<Prop, AnyIResult>
export const i = <A extends Prop, R extends IResult<A>>(result: R): I<A, R> =>
  introduction(result, 'I')
export type ApplyI<A extends Prop> = I<A, IResult<A>>
export const applyI = <A extends Prop>(a: A): ApplyI<A> => i(sequent([a], [a]))
export const reverseI = <A extends Prop, R extends IResult<A>>(
  p: Derivation<R>,
): I<A, R> => {
  return i(p.result)
}
export const tryReverseI = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isIResultDerivation(d) ? reverseI(d) : null
}

// Cut

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
  const δ: Δ = array.init(s1.result.succedent)
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
export const tryReverseCut = <J extends AnySequent, A extends Prop>(
  d: Derivation<J>,
  a: A,
): Derivation<J> | null => {
  return isCutResultDerivation(d) ? reverseCut(d, a) : null
}

// Conjunction & Disjunction

export type CL1Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Conjunction<A, B>], Δ>
export type AnyCL1Result = CL1Result<Formulas, Prop, Prop, Formulas>
export const isCL1Result: Refinement<AnySequent, AnyCL1Result> =
  refineActiveL(isConjunction)
export const isCL1ResultDerivation = refineDerivation(isCL1Result)
export type CL1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A], Δ>>], 'cl1'>
export type AnyCL1 = CL1<Formulas, Prop, Prop, Formulas, AnyCL1Result>
export const cl1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL1Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>],
): CL1<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cl1')
}
export type ApplyCL1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? CL1<Γ, A, B, Δ, CL1Result<Γ, A, B, Δ>>
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
  R extends CL1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL1<Γ, A, B, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const acb: Conjunction<A, B> = array.last(p.result.antecedent)
  const a: A = acb.leftConjunct
  const δ: Δ = p.result.succedent
  return cl1(p.result, [premise(sequent([...γ, a], δ))])
}
export const tryReverseCL1 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCL1ResultDerivation(d) ? reverseCL1(d) : null
}

export type DR1Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Disjunction<A, B>, ...Δ]>
export type AnyDR1Result = DR1Result<Formulas, Prop, Prop, Formulas>
export const isDR1Result: Refinement<AnySequent, AnyDR1Result> = (
  s,
): s is AnyDR1Result => {
  return s.succedent.at(0)?.kind === 'disjunction'
}
export const isDR1ResultDerivation = refineDerivation(isDR1Result)
export type DR1<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, ...Δ]>>], 'dr1'>
export type AnyDR1 = DR1<Formulas, Prop, Prop, Formulas, AnyDR1Result>
export const dr1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>],
): DR1<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dr1')
}
export type ApplyDR1<B extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR1<Γ, A, B, Δ, DR1Result<Γ, A, B, Δ>>
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
  return dr1(sequent(γ, [disjunction(a, b), ...δ]), [s])
}
export const reverseDR1 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR1Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR1<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const adb: Disjunction<A, B> = array.head(p.result.succedent)
  const a: A = adb.leftDisjunct
  const δ: Δ = array.tail(p.result.succedent)
  return dr1(p.result, [premise(sequent(γ, [a, ...δ]))])
}
export const tryReverseDR1 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDR1ResultDerivation(d) ? reverseDR1(d) : null
}

export type CL2Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Conjunction<A, B>], Δ>
export type AnyCL2Result = CL2Result<Formulas, Prop, Prop, Formulas>
export const isCL2Result: Refinement<AnySequent, AnyCL2Result> =
  refineActiveL(isConjunction)
export const isCL2ResultDerivation = refineDerivation(isCL2Result)
export type CL2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, B], Δ>>], 'cl2'>
export type AnyCL2 = CL2<Formulas, Prop, Prop, Formulas, AnyCL2Result>
export const cl2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, B], Δ>>],
): CL2<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cl2')
}
export type ApplyCL2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >
    ? CL2<Γ, A, B, Δ, CL2Result<Γ, A, B, Δ>>
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
  return cl2(sequent([...γ, conjunction(a, b)], δ), [s])
}
export const reverseCL2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CL2Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CL2<Γ, A, B, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const acb: Conjunction<A, B> = array.last(p.result.antecedent)
  const b: B = acb.rightConjunct
  const δ: Δ = p.result.succedent
  return cl2(p.result, [premise(sequent([...γ, b], δ))])
}
export const tryReverseCL2 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCL2ResultDerivation(d) ? reverseCL2(d) : null
}

export type DR2Result<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Disjunction<A, B>, ...Δ]>
export type AnyDR2Result = DR2Result<Formulas, Prop, Prop, Formulas>
export const isDR2Result: Refinement<AnySequent, AnyDR2Result> = (
  s,
): s is AnyDR2Result => {
  return s.succedent.at(0)?.kind === 'disjunction'
}
export const isDR2ResultDerivation = refineDerivation(isDR2Result)
export type DR2<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [B, ...Δ]>>], 'dr2'>
export type AnyDR2 = DR2<Formulas, Prop, Prop, Formulas, AnyDR2Result>
export const dr2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [B, ...Δ]>>],
): DR2<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'dr2')
}
export type ApplyDR2<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer B extends Prop, ...infer Δ extends Formulas]>
  >
    ? DR2<Γ, A, B, Δ, DR2Result<Γ, A, B, Δ>>
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
  return dr2(sequent(γ, [disjunction(a, b), ...δ]), [s])
}
export const reverseDR2 = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DR2Result<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DR2<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const adb: Disjunction<A, B> = array.head(p.result.succedent)
  const b: B = adb.rightDisjunct
  const δ: Δ = array.tail(p.result.succedent)
  return dr2(p.result, [premise(sequent(γ, [b, ...δ]))])
}
export const tryReverseDR2 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDR2ResultDerivation(d) ? reverseDR2(d) : null
}

export type DLResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Disjunction<A, B>], Δ>
export type AnyDLResult = DLResult<Formulas, Prop, Prop, Formulas>
export const isDLResult: Refinement<AnySequent, AnyDLResult> =
  refineActiveL(isDisjunction)
export const isDLResultDerivation = refineDerivation(isDLResult)
export type DL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'dl'
>
export type AnyDL = DL<Formulas, Prop, Prop, Formulas, AnyDLResult>
export const dl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Γ, B], Δ>>],
): DL<Γ, A, B, Δ, R> => {
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
  ? DL<Γ, A, B, Δ, DLResult<Γ, A, B, Δ>>
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
export const reverseDL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends DLResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): DL<Γ, A, B, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const adb: Disjunction<A, B> = array.last(p.result.antecedent)
  const a: A = adb.leftDisjunct
  const b: B = adb.rightDisjunct
  const δ: Δ = p.result.succedent
  return dl(p.result, [
    premise(sequent([...γ, a], δ)),
    premise(sequent([...γ, b], δ)),
  ])
}
export const tryReverseDL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isDLResultDerivation(d) ? reverseDL(d) : null
}

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
  R extends CRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): CR<Γ, A, B, Δ, R> => {
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
export const tryReverseCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isCRResultDerivation(d) ? reverseCR(d) : null
}

// Implication

export type ILResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Implication<A, B>], Δ>
export type AnyILResult = ILResult<Formulas, Prop, Prop, Formulas>
export const isILResult: Refinement<AnySequent, AnyILResult> =
  refineActiveL(isImplication)
export const isILResultDerivation = refineDerivation(isILResult)
export type IL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
> = Transformation<
  R,
  [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
  'il'
>
export type AnyIL = IL<Formulas, Prop, Prop, Formulas, AnyILResult>
export const il = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Γ, B], Δ>>],
): IL<Γ, A, B, Δ, R> => {
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
  ? IL<Γ, A, B, Δ, ILResult<Γ, A, B, Δ>>
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
export const reverseIL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends ILResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): IL<Γ, A, B, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const aib: Implication<A, B> = array.last(p.result.antecedent)
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ: Δ = p.result.succedent
  return il(p.result, [
    premise(sequent(γ, [a, ...δ])),
    premise(sequent([...γ, b], δ)),
  ])
}
export const tryReverseIL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isILResultDerivation(d) ? reverseIL(d) : null
}

export type IRResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Implication<A, B>, ...Δ]>
export type AnyIRResult = IRResult<Formulas, Prop, Prop, Formulas>
export const isIRResult: Refinement<AnySequent, AnyIRResult> =
  refineActiveR(isImplication)
export const isIRResultDerivation = refineDerivation(isIRResult)
export type IR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>], 'ir'>
export type AnyIR = IR<Formulas, Prop, Prop, Formulas, AnyIRResult>
export const ir = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>],
): IR<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'ir')
}
export type ApplyIR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop],
      [infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? IR<Γ, A, B, Δ, IRResult<Γ, A, B, Δ>>
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
  return ir(sequent(γ, [implication(a, b), ...δ]), [s])
}
export const reverseIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): IR<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const aib: Implication<A, B> = array.head(p.result.succedent)
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ: Δ = array.tail(p.result.succedent)
  return ir(p.result, [premise(sequent([...γ, a], [b, ...δ]))])
}
export const tryReverseIR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isIRResultDerivation(d) ? reverseIR(d) : null
}

// Negation

export type NLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, Negation<A>], Δ>
export type AnyNLResult = NLResult<Formulas, Prop, Formulas>
export const isNLResult: Refinement<AnySequent, AnyNLResult> =
  refineActiveL(isNegation)
export const isNLResultDerivation = refineDerivation(isNLResult)
export type NL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, ...Δ]>>], 'nl'>
export type AnyNL = NL<Formulas, Prop, Formulas, AnyNLResult>
export const nl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>],
): NL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'nl')
}
export type ApplyNL<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? NL<Γ, A, Δ, NLResult<Γ, A, Δ>>
    : never
export const applyNL = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): ApplyNL<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = array.head(s.result.succedent)
  const δ: Δ = array.tail(s.result.succedent)
  return nl(sequent([...γ, negation(a)], δ), [s])
}
export const reverseNL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NL<Γ, A, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const na: Negation<A> = array.last(p.result.antecedent)
  const a: A = na.negand
  const δ: Δ = p.result.succedent
  return nl(p.result, [premise(sequent(γ, [a, ...δ]))])
}
export const tryReverseNL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isNLResultDerivation(d) ? reverseNL(d) : null
}

export type NRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Negation<A>, ...Δ]>
export type AnyNRResult = NRResult<Formulas, Prop, Formulas>
export const isNRResult: Refinement<AnySequent, AnyNRResult> =
  refineActiveR(isNegation)
export const isNRResultDerivation = refineDerivation(isNRResult)
export type NR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A], Δ>>], 'nr'>
export type AnyNR = NR<Formulas, Prop, Formulas, AnyNRResult>
export const nr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], Δ>>],
): NR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'nr')
}
export type ApplyNR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? NR<Γ, A, Δ, NRResult<Γ, A, Δ>>
    : never

export const applyNR = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): ApplyNR<Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return nr(sequent(γ, [negation(a), ...δ]), [s])
}
export const reverseNR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends NRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): NR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const na: Negation<A> = array.head(p.result.succedent)
  const a: A = na.negand
  const δ: Δ = array.tail(p.result.succedent)
  return nr(p.result, [premise(sequent([...γ, a], δ))])
}
export const tryReverseNR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isNRResultDerivation(d) ? reverseNR(d) : null
}

// Weakening

export type SWLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, A], Δ>
export type AnySWLResult = SWLResult<Formulas, Prop, Formulas>
export const isSWLResult: Refinement<AnySequent, AnySWLResult> = (
  s,
): s is AnySWLResult => {
  return s.antecedent.length > 0
}
export const isSWLResultDerivation = refineDerivation(isSWLResult)
export type SWL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, Δ>>], 'swl'>
export type AnySWL = SWL<Formulas, Prop, Formulas, AnySWLResult>
export const swl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, Δ>>],
): SWL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'swl')
}
export type ApplySWL<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<Sequent<infer Γ, infer Δ>>
    ? SWL<Γ, A, Δ, SWLResult<Γ, A, Δ>>
    : never
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
  return swl(sequent([...γ, a], δ), [s])
}
export const reverseSWL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SWL<Γ, A, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return swl(p.result, [premise(sequent(γ, δ))])
}
export const tryReverseSWL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSWLResultDerivation(d) ? reverseSWL(d) : null
}

export type SWRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, ...Δ]>
export type AnySWRResult = SWRResult<Formulas, Prop, Formulas>
export const isSWRResult: Refinement<AnySequent, AnySWRResult> = isActiveR
export const isSWRResultDerivation = refineDerivation(isSWRResult)
export type SWR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, Δ>>], 'swr'>
export type AnySWR = SWR<Formulas, Prop, Formulas, AnySWRResult>
export const swr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, Δ>>],
): SWR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'swr')
}
export type ApplySWR<A extends Prop, S extends AnyDerivation> =
  S extends Derivation<Sequent<infer Γ, infer Δ>>
    ? SWR<Γ, A, Δ, SWRResult<Γ, A, Δ>>
    : never
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
  return swr(sequent(γ, [a, ...δ]), [s])
}
export const reverseSWR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SWR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = array.tail(p.result.succedent)
  return swr(p.result, [premise(sequent(γ, δ))])
}
export const tryReverseSWR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSWRResultDerivation(d) ? reverseSWR(d) : null
}

// Contraction

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
export type SCL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A, A], Δ>>], 'scl'>
export type AnySCL = SCL<Formulas, Prop, Formulas, AnySCLResult>
export const scl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, A], Δ>>],
): SCL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'scl')
}
export type ApplySCL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer A extends Prop],
      infer Δ
    >
  >
    ? SCL<Γ, A, Δ, SCLResult<Γ, A, Δ>>
    : never
export const applySCL = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<[...Γ, A, A], Δ>>,
): ApplySCL<Derivation<Sequent<[...Γ, A, A], Δ>>> => {
  const γ: Γ = array.init(array.init(s.result.antecedent))
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return scl(sequent([...γ, a], δ), [s])
}
export const reverseSCL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SCL<Γ, A, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const a: A = array.last(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return scl(p.result, [premise(sequent([...γ, a, a], δ))])
}
export const tryReverseSCL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSCLResultDerivation(d) ? reverseSCL(d) : null
}

export type SCRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, ...Δ]>
export type AnySCRResult = SCRResult<Formulas, Prop, Formulas>
export const isSCRResult: Refinement<AnySequent, AnySCRResult> = isActiveR
export const isSCRResultDerivation = refineDerivation(isSCRResult)
export type SCR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, A, ...Δ]>>], 'scr'>
export type AnySCR = SCR<Formulas, Prop, Formulas, AnySCRResult>
export const scr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, A, ...Δ]>>],
): SCR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'scr')
}
export type ApplySCR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer A extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SCR<Γ, A, Δ, SCRResult<Γ, A, Δ>>
    : never
export const applySCR = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<Γ, [A, A, ...Δ]>>,
): ApplySCR<Derivation<Sequent<Γ, [A, A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = array.head(s.result.succedent)
  const δ: Δ = array.tail(array.tail(s.result.succedent))
  return scr(sequent(γ, [a, ...δ]), [s])
}
export const reverseSCR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SCR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const a: A = array.head(p.result.succedent)
  const δ: Δ = array.tail(p.result.succedent)
  return scr(p.result, [premise(sequent(γ, [a, a, ...δ]))])
}
export const tryReverseSCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSCRResultDerivation(d) ? reverseSCR(d) : null
}

// Permutation

export type SRotLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, A], Δ>
export type AnySRotLResult = SRotLResult<Formulas, Prop, Formulas>
export const isSRotLResult: Refinement<AnySequent, AnySRotLResult> = (
  s,
): s is AnySRotLResult => {
  return s.antecedent.length > 0
}
export const isSRotLResultDerivation = refineDerivation(isSRotLResult)
export type SRotL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[A, ...Γ], Δ>>], 'srotl'>
export type AnySRotL = SRotL<Formulas, Prop, Formulas, AnySRotLResult>
export const srotl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[A, ...Γ], Δ>>],
): SRotL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'srotl')
}
export type ApplySRotL<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<[infer A extends Prop, ...infer Γ extends Formulas], infer Δ>
  >
    ? SRotL<Γ, A, Δ, SRotLResult<Γ, A, Δ>>
    : never
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
  return srotl(sequent([...γ, a], δ), [s])
}
export const reverseSRotL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SRotL<Γ, A, Δ, R> => {
  const γ: Γ = array.init(p.result.antecedent)
  const a: A = array.last(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return srotl(p.result, [premise(sequent([a, ...γ], δ))])
}
export const tryReverseSRotL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotLResultDerivation(d) ? reverseSRotL(d) : null
}

export type SRotRResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [...Δ, A]>
export type AnySRotRResult = SRotRResult<Formulas, Prop, Formulas>
export const isSRotRResult: Refinement<AnySequent, AnySRotRResult> = (
  s,
): s is AnySRotRResult => {
  return s.succedent.length > 0
}
export const isSRotRResultDerivation = refineDerivation(isSRotRResult)
export type SRotR<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotRResult<Γ, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, ...Δ]>>], 'srotr'>
export type AnySRotR = SRotR<Formulas, Prop, Formulas, AnySRotRResult>
export const srotr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotRResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, ...Δ]>>],
): SRotR<Γ, A, Δ, R> => {
  return transformation(result, deps, 'srotr')
}
export type ApplySRotR<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? SRotR<Γ, A, Δ, SRotRResult<Γ, A, Δ>>
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
  return srotr(sequent(γ, [...δ, a]), [s])
}
export const reverseSRotR = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotRResult<Γ, A, Δ>,
>(
  p: Derivation<R>,
): SRotR<Γ, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = array.init(p.result.succedent)
  const a: A = array.last(p.result.succedent)
  return srotr(p.result, [premise(sequent(γ, [a, ...δ]))])
}
export const tryReverseSRotR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotRResultDerivation(d) ? reverseSRotR(d) : null
}

export type SSwpLResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, B, A], Δ>
export type AnySSwpLResult = SSwpLResult<Formulas, Prop, Prop, Formulas>
export const isSSwpLResult: Refinement<AnySequent, AnySSwpLResult> = (
  s,
): s is AnySSwpLResult => {
  return s.antecedent.length > 1
}
export const isSSwpLResultDerivation = refineDerivation(isSSwpLResult)
export type SSwpL<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SSwpLResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A, B], Δ>>], 'sswpl'>
export type AnySSwpL = SSwpL<Formulas, Prop, Prop, Formulas, AnySSwpLResult>
export const sswpl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SSwpLResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, B], Δ>>],
): SSwpL<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sswpl')
}
export type ApplySSwpL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop],
      infer Δ
    >
  >
    ? SSwpL<Γ, B, A, Δ, SSwpLResult<Γ, B, A, Δ>>
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
  return sswpl(sequent([...γ, b, a], δ), [s])
}
export const reverseSSwpL = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SSwpLResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SSwpL<Γ, B, A, Δ, R> => {
  const γ: Γ = array.init(array.init(p.result.antecedent))
  const a: A = array.last(p.result.antecedent)
  const b: B = array.last(array.init(p.result.antecedent))
  const δ: Δ = p.result.succedent
  return sswpl(p.result, [premise(sequent([...γ, a, b], δ))])
}
export const tryReverseSSwpL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSSwpLResultDerivation(d) ? reverseSSwpL(d) : null
}

export type SSwpRResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [B, A, ...Δ]>
export type AnySSwpRResult = SSwpRResult<Formulas, Prop, Prop, Formulas>
export const isSSwpRResult: Refinement<AnySequent, AnySSwpRResult> = (
  s,
): s is AnySSwpRResult => {
  return s.succedent.length > 1
}
export const isSSwpRResultDerivation = refineDerivation(isSSwpRResult)
export type SSwpR<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SSwpRResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'sswpr'>
export type AnySSwpR = SSwpR<Formulas, Prop, Prop, Formulas, AnySSwpRResult>
export const sswpr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SSwpRResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): SSwpR<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sswpr')
}
export type ApplySSwpR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SSwpR<Γ, B, A, Δ, SSwpRResult<Γ, B, A, Δ>>
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
  return sswpr(sequent(γ, [b, a, ...δ]), [s])
}
export const reverseSSwpR = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SSwpRResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SSwpR<Γ, B, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const a: A = array.head(array.tail(p.result.succedent))
  const b: B = array.head(p.result.succedent)
  const δ: Δ = array.tail(array.tail(p.result.succedent))
  return sswpr(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseSSwpR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSSwpRResultDerivation(d) ? reverseSSwpR(d) : null
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
  i: applyI,
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
          applySRotL(premise(sequent([atom('Γ'), atom('A')], [atom('Δ')]))),
          applySRotR(premise(sequent([atom('Γ')], [atom('A'), atom('Δ')]))),
        ],
        [
          applySSwpL(
            premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')])),
          ),
          applySSwpR(
            premise(sequent([atom('Γ')], [atom('A'), atom('B'), atom('Δ')])),
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
