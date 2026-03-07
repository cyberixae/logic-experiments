import * as prop from '../model/prop'
import * as array from '../utils/array'
import * as tuple from '../utils/tuple'
import * as head from '../utils/tuple'
import * as print from '../render/print'
import {
  Formulas,
  Judgement as Sequent,
  judgement as sequent,
  AnyJudgement as AnySequent,
} from '../model/judgement'
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
  editDerivation,
  Path,
} from '../model/derivation'
import { Refinement } from '../utils/generic'
import { Option } from '../utils/option'
import { entries } from '../utils/record'

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
    return isActiveL(j) && r(tuple.last(j.antecedent))
  }

export type ActiveR<B extends Prop> = Sequent<Formulas, [B, ...Formulas]>
export const isActiveR = (j: AnySequent): j is ActiveR<Prop> => {
  return array.isNonEmptyArray(j.succedent)
}
export const refineActiveR =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is ActiveR<B> => {
    return isActiveR(j) && r(head.head(j.succedent))
  }

// Axiom

export type IResult<A extends Prop> = Sequent<[A], [A]>
export type AnyIResult = IResult<Prop>
export const isIResult: Refinement<AnySequent, AnyIResult> = (
  s,
): s is AnyIResult => {
  return (
    tuple.isTupleOf1(s.antecedent) &&
    tuple.isTupleOf1(s.succedent) &&
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
  const γ: Γ = tuple.init(s.result.antecedent)
  const a: A = tuple.last(s.result.antecedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
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
  const δ: Δ = tuple.tail(s.result.succedent)
  const a: A = head.head(s.result.succedent)
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
  const adb: Disjunction<A, B> = head.head(p.result.succedent)
  const a: A = adb.leftDisjunct
  const δ: Δ = tuple.tail(p.result.succedent)
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
  const γ: Γ = tuple.init(s.result.antecedent)
  const b: B = tuple.last(s.result.antecedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent)
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
  const δ: Δ = tuple.tail(s.result.succedent)
  const b: B = head.head(s.result.succedent)
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
  const adb: Disjunction<A, B> = head.head(p.result.succedent)
  const b: B = adb.rightDisjunct
  const δ: Δ = tuple.tail(p.result.succedent)
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
  const γ: Γ = tuple.init(s1.result.antecedent)
  const a: A = tuple.last(s1.result.antecedent)
  const b: B = tuple.last(s2.result.antecedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const adb: Disjunction<A, B> = tuple.last(p.result.antecedent)
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
  const a: A = head.head(s1.result.succedent)
  const b: B = head.head(s2.result.succedent)
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
  const acb: Conjunction<A, B> = head.head(p.result.succedent)
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
  const a: A = head.head(s1.result.succedent)
  const b: B = tuple.last(s2.result.antecedent)
  const δ: Δ = tuple.tail(s1.result.succedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const aib: Implication<A, B> = tuple.last(p.result.antecedent)
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
  const γ: Γ = tuple.init(s.result.antecedent)
  const a: A = tuple.last(s.result.antecedent)
  const b: B = head.head(s.result.succedent)
  const δ: Δ = tuple.tail(s.result.succedent)
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
  const aib: Implication<A, B> = head.head(p.result.succedent)
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ: Δ = tuple.tail(p.result.succedent)
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
  const a: A = head.head(s.result.succedent)
  const δ: Δ = tuple.tail(s.result.succedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const na: Negation<A> = tuple.last(p.result.antecedent)
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
  const γ: Γ = tuple.init(s.result.antecedent)
  const a: A = tuple.last(s.result.antecedent)
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
  const na: Negation<A> = head.head(p.result.succedent)
  const a: A = na.negand
  const δ: Δ = tuple.tail(p.result.succedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
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
  const δ: Δ = tuple.tail(p.result.succedent)
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
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent))
  const a: A = tuple.last(s.result.antecedent)
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
  const γ: Γ = tuple.init(p.result.antecedent)
  const a: A = tuple.last(p.result.antecedent)
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
  const a: A = head.head(s.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
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
  const a: A = head.head(p.result.succedent)
  const δ: Δ = tuple.tail(p.result.succedent)
  return scr(p.result, [premise(sequent(γ, [a, a, ...δ]))])
}
export const tryReverseSCR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSCRResultDerivation(d) ? reverseSCR(d) : null
}

// Permutation

export type SRotLFResult<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<[A, ...Γ, B], Δ>
export type AnySRotLFResult = SRotLFResult<Prop, Formulas, Prop, Formulas>
export const isSRotLFResult: Refinement<AnySequent, AnySRotLFResult> = (
  s,
): s is AnySRotLFResult => {
  return s.antecedent.length > 1
}
export const isSRotLFResultDerivation = refineDerivation(isSRotLFResult)
export type SRotLF<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, B, A], Δ>>], 'SRotLF'>
export type AnySRotLF = SRotLF<Prop, Formulas, Prop, Formulas, AnySRotLFResult>
export const sRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, B, A], Δ>>],
): SRotLF<A, Γ, B, Δ, R> => {
  return transformation(result, deps, 'SRotLF')
}
export type ApplySRotLF<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer B extends Prop, infer A extends Prop],
      infer Δ
    >
  >
    ? SRotLF<A, Γ, B, Δ, SRotLFResult<A, Γ, B, Δ>>
    : never
export const applySRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, B, A], Δ>>,
): ApplySRotLF<Derivation<Sequent<[...Γ, B, A], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent))
  const a: A = tuple.last(s.result.antecedent)
  const b: B = tuple.last(tuple.init(s.result.antecedent))
  const δ: Δ = s.result.succedent
  return sRotLF(sequent([a, ...γ, b], δ), [s])
}
export const reverseSRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
>(
  p: Derivation<R>,
): SRotLF<A, Γ, B, Δ, R> => {
  const γ: Γ = tuple.init(tuple.tail(p.result.antecedent))
  const a: A = head.head(p.result.antecedent)
  const b: B = tuple.last(p.result.antecedent)
  const δ: Δ = p.result.succedent
  return sRotLF(p.result, [premise(sequent([...γ, b, a], δ))])
}
export const tryReverseSRotLF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotLFResultDerivation(d) ? reverseSRotLF(d) : null
}

export type SRotLBResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, B, A], Δ>
export type AnySRotLBResult = SRotLBResult<Formulas, Prop, Prop, Formulas>
export const isSRotLBResult: Refinement<AnySequent, AnySRotLBResult> = (
  s,
): s is AnySRotLBResult => {
  return s.antecedent.length > 1
}
export const isSRotLBResultDerivation = refineDerivation(isSRotLBResult)
export type SRotLB<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[A, ...Γ, B], Δ>>], 'SRotLB'>
export type AnySRotLB = SRotLB<Formulas, Prop, Prop, Formulas, AnySRotLBResult>
export const sRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[A, ...Γ, B], Δ>>],
): SRotLB<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'SRotLB')
}
export type ApplySRotLB<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      [infer A extends Prop, ...infer Γ extends Formulas, infer B extends Prop],
      infer Δ
    >
  >
    ? SRotLB<Γ, B, A, Δ, SRotLBResult<Γ, B, A, Δ>>
    : never
export const applySRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[A, ...Γ, B], Δ>>,
): ApplySRotLB<Derivation<Sequent<[A, ...Γ, B], Δ>>> => {
  const a: A = head.head(s.result.antecedent)
  const γ: Γ = tuple.init(tuple.tail(s.result.antecedent))
  const b: B = tuple.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return sRotLB(sequent([...γ, b, a], δ), [s])
}
export const reverseSRotLB = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SRotLBResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SRotLB<Γ, B, A, Δ, R> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent))
  const a: A = tuple.last(p.result.antecedent)
  const b: B = tuple.last(tuple.init(p.result.antecedent))
  const δ: Δ = p.result.succedent
  return sRotLB(p.result, [premise(sequent([a, ...γ, b], δ))])
}
export const tryReverseSRotLB = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotLBResultDerivation(d) ? reverseSRotLB(d) : null
}

export type SRotRFResult<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
> = Sequent<Γ, [B, ...Δ, A]>
export type AnySRotRFResult = SRotRFResult<Formulas, Prop, Formulas, Prop>
export const isSRotRFResult: Refinement<AnySequent, AnySRotRFResult> = (
  s,
): s is AnySRotRFResult => {
  return s.succedent.length > 1
}
export const isSRotRFResultDerivation = refineDerivation(isSRotRFResult)
export type SRotRF<
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'SRotRF'>
export type AnySRotRF = SRotRF<Formulas, Prop, Formulas, Prop, AnySRotRFResult>
export const sRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): SRotRF<Γ, B, Δ, A, R> => {
  return transformation(result, deps, 'SRotRF')
}
export type ApplySRotRF<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SRotRF<Γ, B, Δ, A, SRotRFResult<Γ, B, Δ, A>>
    : never
export const applySRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplySRotRF<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  const a: A = head.head(s.result.succedent)
  const b: B = head.head(tuple.tail(s.result.succedent))
  return sRotRF(sequent(γ, [b, ...δ, a]), [s])
}
export const reverseSRotRF = <
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  A extends Prop,
  R extends SRotRFResult<Γ, B, Δ, A>,
>(
  p: Derivation<R>,
): SRotRF<Γ, B, Δ, A, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = tuple.init(tuple.tail(p.result.succedent))
  const a: A = tuple.last(p.result.succedent)
  const b: B = head.head(p.result.succedent)
  return sRotRF(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseSRotRF = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotRFResultDerivation(d) ? reverseSRotRF(d) : null
}

export type SRotRBResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [A, B, ...Δ]>
export type AnySRotRBResult = SRotRBResult<Formulas, Prop, Prop, Formulas>
export const isSRotRBResult: Refinement<AnySequent, AnySRotRBResult> = (
  s,
): s is AnySRotRBResult => {
  return s.succedent.length > 1
}
export const isSRotRBResultDerivation = refineDerivation(isSRotRBResult)
export type SRotRB<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [B, ...Δ, A]>>], 'SRotRB'>
export type AnySRotRB = SRotRB<Formulas, Prop, Prop, Formulas, AnySRotRBResult>
export const sRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [B, ...Δ, A]>>],
): SRotRB<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'SRotRB')
}
export type ApplySRotRB<S extends AnyDerivation> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer B extends Prop, ...infer Δ extends Formulas, infer A extends Prop]
    >
  >
    ? SRotRB<Γ, A, B, Δ, SRotRBResult<Γ, A, B, Δ>>
    : never
export const applySRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [B, ...Δ, A]>>,
): ApplySRotRB<Derivation<Sequent<Γ, [B, ...Δ, A]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = tuple.init(tuple.tail(s.result.succedent))
  const a: A = tuple.last(s.result.succedent)
  const b: B = head.head(s.result.succedent)
  return sRotRB(sequent(γ, [a, b, ...δ]), [s])
}
export const reverseSRotRB = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotRBResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): SRotRB<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const δ: Δ = tuple.tail(tuple.tail(p.result.succedent))
  const a: A = head.head(p.result.succedent)
  const b: B = head.head(tuple.tail(p.result.succedent))
  return sRotRB(p.result, [premise(sequent(γ, [b, ...δ, a]))])
}
export const tryReverseSRotRB = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSRotRBResultDerivation(d) ? reverseSRotRB(d) : null
}

export type SXLResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<[...Γ, B, A], Δ>
export type AnySXLResult = SXLResult<Formulas, Prop, Prop, Formulas>
export const isSXLResult: Refinement<AnySequent, AnySXLResult> = (
  s,
): s is AnySXLResult => {
  return s.antecedent.length > 1
}
export const isSXLResultDerivation = refineDerivation(isSXLResult)
export type SXL<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<[...Γ, A, B], Δ>>], 'sxl'>
export type AnySXL = SXL<Formulas, Prop, Prop, Formulas, AnySXLResult>
export const sxl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, B], Δ>>],
): SXL<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sxl')
}
export type ApplySXL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> =
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop],
      infer Δ
    >
  >
    ? SXL<Γ, B, A, Δ, SXLResult<Γ, B, A, Δ>>
    : never
export const applySXL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A, B], Δ>>,
): ApplySXL<Derivation<Sequent<[...Γ, A, B], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent))
  const b: B = tuple.last(s.result.antecedent)
  const a: A = tuple.last(tuple.init(s.result.antecedent))
  const δ: Δ = s.result.succedent
  return sxl(sequent([...γ, b, a], δ), [s])
}
export const reverseSXL = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SXL<Γ, B, A, Δ, R> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent))
  const a: A = tuple.last(p.result.antecedent)
  const b: B = tuple.last(tuple.init(p.result.antecedent))
  const δ: Δ = p.result.succedent
  return sxl(p.result, [premise(sequent([...γ, a, b], δ))])
}
export const tryReverseSXL = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSXLResultDerivation(d) ? reverseSXL(d) : null
}

export type SXRResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [B, A, ...Δ]>
export type AnySXRResult = SXRResult<Formulas, Prop, Prop, Formulas>
export const isSXRResult: Refinement<AnySequent, AnySXRResult> = (
  s,
): s is AnySXRResult => {
  return s.succedent.length > 1
}
export const isSXRResultDerivation = refineDerivation(isSXRResult)
export type SXR<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
> = Transformation<R, [Derivation<Sequent<Γ, [A, B, ...Δ]>>], 'sxr'>
export type AnySXR = SXR<Formulas, Prop, Prop, Formulas, AnySXRResult>
export const sxr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, [A, B, ...Δ]>>],
): SXR<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sxr')
}
export type ApplySXR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> =
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? SXR<Γ, B, A, Δ, SXRResult<Γ, B, A, Δ>>
    : never
export const applySXR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): ApplySXR<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const b: B = head.head(tuple.tail(s.result.succedent))
  const a: A = head.head(s.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(s.result.succedent))
  return sxr(sequent(γ, [b, a, ...δ]), [s])
}
export const reverseSXR = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXRResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>,
): SXR<Γ, B, A, Δ, R> => {
  const γ: Γ = p.result.antecedent
  const a: A = head.head(tuple.tail(p.result.succedent))
  const b: B = head.head(p.result.succedent)
  const δ: Δ = tuple.tail(tuple.tail(p.result.succedent))
  return sxr(p.result, [premise(sequent(γ, [a, b, ...δ]))])
}
export const tryReverseSXR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isSXRResultDerivation(d) ? reverseSXR(d) : null
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
  sRotLF: applySRotLF,
  sRotLB: applySRotLB,
  sRotRF: applySRotRF,
  sRotRB: applySRotRB,
  sxl: applySXL,
  sxr: applySXR,
}

export const rev = {
  i: tryReverseI,
  cl1: tryReverseCL1,
  dr1: tryReverseDR1,
  cl2: tryReverseCL2,
  dr2: tryReverseDR2,
  dl: tryReverseDL,
  cr: tryReverseCR,
  il: tryReverseIL,
  ir: tryReverseIR,
  nl: tryReverseNL,
  nr: tryReverseNR,
  swl: tryReverseSWL,
  swr: tryReverseSWR,
  scl: tryReverseSCL,
  scr: tryReverseSCR,
  sRotLF: tryReverseSRotLF,
  sRotLB: tryReverseSRotLB,
  sRotRF: tryReverseSRotRF,
  sRotRB: tryReverseSRotRB,
  sxl: tryReverseSXL,
  sxr: tryReverseSXR,
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
          applySRotLF(
            premise(sequent([atom('Γ'), atom('B'), atom('A')], [atom('Δ')])),
          ),
          applySRotRF(
            premise(sequent([atom('Γ')], [atom('A'), atom('B'), atom('Δ')])),
          ),
        ],
        [
          applySRotLB(
            premise(sequent([atom('A'), atom('Γ'), atom('B')], [atom('Δ')])),
          ),
          applySRotRB(
            premise(sequent([atom('Γ')], [atom('B'), atom('Δ'), atom('A')])),
          ),
        ],
        [
          applySXL(
            premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')])),
          ),
          applySXR(
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

export type Rev = keyof typeof rev
export const isRev = (u: unknown): u is Rev => typeof u === 'string' && u in rev;

export const revs = <J extends AnySequent>(d: Derivation<J>, p: Path): Array<[Rev, Derivation<J>]> => entries(rev).flatMap(([rev, ed]): Option<[Rev, Derivation<J>]> => {
  const result = editDerivation(d, p, ed)
  if (result) {
    return [[rev, result]]
  }
  return []
})

