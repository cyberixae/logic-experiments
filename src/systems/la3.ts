import { Prop, Atom, Negation, Implication, atom, negation, implication, equals } from '../model/prop'
import * as array from '../utils/array'
import * as head from '../utils/tuple'
import * as utils from '../utils/utils'
import { AnyConclusion, Conclusion, conclusion } from '../model/judgement'
import * as print from '../render/print'
import {
  introduction,
  Introduction,
  Derivation,
  transformation,
  premise,
  Transformation,
  refineDerivation,
  editDerivation as editBranchG,
  toProof,
  Edit,
} from '../model/derivation'
import { Refinement } from '../utils/generic'

// Abbreviations

export type Disjunction<A extends Prop, B extends Prop> = Implication<
  Negation<A>,
  B
>
export const disjunction = <A extends Prop, B extends Prop>(
  a: A,
  b: B,
): Disjunction<A, B> => implication(negation(a), b)

export type Conjunction<A extends Prop, B extends Prop> = Negation<
  Implication<A, Negation<B>>
>
export const conjunction = <A extends Prop, B extends Prop>(
  a: A,
  b: B,
): Conjunction<A, B> => negation(implication(a, negation(b)))

// Axioms

export type A1Result<P extends Prop, Q extends Prop> = Conclusion<
  Implication<P, Implication<Q, P>>
>
export type AnyA1Result = A1Result<Prop, Prop>
export const isA1Result: Refinement<AnyConclusion, AnyA1Result> = (
  c,
): c is AnyA1Result => {
  const piqip = head.head(c.succedent)
  if (piqip.kind !== 'implication') {
    return false
  }
  const p1 = piqip.antecedent
  const qip = piqip.consequent
  if (qip.kind !== 'implication') {
    return false
  }
  const p2 = qip.consequent
  return equals(p1, p2)
}
export const isA1ResultDerivation = refineDerivation(isA1Result)
export type A1<
  P extends Prop,
  Q extends Prop,
  C extends A1Result<P, Q>,
> = Introduction<C, 'A1'>
export type AnyA1 = A1<Prop, Prop, AnyA1Result>
export const a1 = <P extends Prop, Q extends Prop, C extends A1Result<P, Q>>(
  result: C,
): A1<P, Q, C> => {
  return introduction(result, 'A1')
}
export type ApplyA1<P extends Prop, Q extends Prop> = A1<P, Q, A1Result<P, Q>>
export const applyA1 = <P extends Prop, Q extends Prop>(
  p: P,
  q: Q,
): ApplyA1<P, Q> => {
  return a1(conclusion(implication(p, implication(q, p))))
}
export const reverseA1 = <
  P extends Prop,
  Q extends Prop,
  C extends A1Result<P, Q>,
>(
  p: Derivation<C>,
): A1<P, Q, C> => {
  return a1(p.result)
}
export const tryReverseA1 = <C extends AnyConclusion>(
  d: Derivation<C>,
): Derivation<C> | null => {
  return isA1ResultDerivation(d) ? reverseA1(d) : null
}

export type A2Result<
  P extends Prop,
  Q extends Prop,
  R extends Prop,
> = Conclusion<
  Implication<
    Implication<P, Implication<Q, R>>,
    Implication<Implication<P, Q>, Implication<P, R>>
  >
>
export type AnyA2Result = A2Result<Prop, Prop, Prop>
export const isA2Result: Refinement<AnyConclusion, AnyA2Result> = (
  c,
): c is AnyA2Result => {
  const piqiripiqipir = head.head(c.succedent)
  if (piqiripiqipir.kind !== 'implication') {
    return false
  }
  const piqir = piqiripiqipir.antecedent
  if (piqir.kind !== 'implication') {
    return false
  }
  const p1 = piqir.antecedent
  const qir = piqir.consequent
  if (qir.kind !== 'implication') {
    return false
  }
  const q1 = qir.antecedent
  const r1 = qir.consequent

  const piqipir = piqiripiqipir.consequent
  if (piqipir.kind !== 'implication') {
    return false
  }
  const piq = piqipir.antecedent
  if (piq.kind !== 'implication') {
    return false
  }
  const p2 = piq.antecedent
  const q2 = piq.consequent
  const pir = piqipir.consequent
  if (pir.kind !== 'implication') {
    return false
  }
  const p3 = pir.antecedent
  const r2 = pir.consequent

  if (!equals(p1, p2)) {
    return false
  }
  if (!equals(p2, p3)) {
    return false
  }
  if (!equals(q1, q2)) {
    return false
  }
  if (!equals(r1, r2)) {
    return false
  }
  return true
}
export const isA2ResultDerivation = refineDerivation(isA2Result)
export type A2<
  P extends Prop,
  Q extends Prop,
  R extends Prop,
  C extends A2Result<P, Q, R>,
> = Introduction<C, 'A2'>
export const a2 = <
  P extends Prop,
  Q extends Prop,
  R extends Prop,
  C extends A2Result<P, Q, R>,
>(
  result: C,
): A2<P, Q, R, C> => {
  return introduction(result, 'A2')
}
export type AnyA2 = A2<Prop, Prop, Prop, AnyA2Result>
export type ApplyA2<P extends Prop, Q extends Prop, R extends Prop> = A2<
  P,
  Q,
  R,
  A2Result<P, Q, R>
>
export const applyA2 = <P extends Prop, Q extends Prop, R extends Prop>(
  p: P,
  q: Q,
  r: R,
): ApplyA2<P, Q, R> =>
  a2(
    conclusion(
      implication(
        implication(p, implication(q, r)),
        implication(implication(p, q), implication(p, r)),
      ),
    ),
  )
export const reverseA2 = <
  P extends Prop,
  Q extends Prop,
  R extends Prop,
  C extends A2Result<P, Q, R>,
>(
  p: Derivation<C>,
): A2<P, Q, R, C> => {
  return a2(p.result)
}
export const tryReverseA2 = <C extends AnyConclusion>(
  d: Derivation<C>,
): Derivation<C> | null => {
  return isA2ResultDerivation(d) ? reverseA2(d) : null
}

export type A3Result<P extends Prop, Q extends Prop> = Conclusion<
  Implication<Implication<Negation<P>, Negation<Q>>, Implication<Q, P>>
>
export type AnyA3Result = A3Result<Prop, Prop>
export const isA3Result: Refinement<AnyConclusion, AnyA3Result> = (
  c,
): c is AnyA3Result => {
  const npinqiqip = head.head(c.succedent)
  if (npinqiqip.kind !== 'implication') {
    return false
  }
  const npinq = npinqiqip.antecedent
  if (npinq.kind !== 'implication') {
    return false
  }
  const np = npinq.antecedent
  if (np.kind !== 'negation') {
    return false
  }
  const p1 = np.negand
  const nq = npinq.consequent
  if (nq.kind !== 'negation') {
    return false
  }
  const q1 = nq.negand
  const qip = npinqiqip.consequent
  if (qip.kind !== 'implication') {
    return false
  }
  const q2 = qip.antecedent
  const p2 = qip.consequent
  return equals(p1, p2) && equals(q1, q2)
}
export const isA3ResultDerivation = refineDerivation(isA3Result)
export type A3<
  P extends Prop,
  Q extends Prop,
  C extends A3Result<P, Q>,
> = Introduction<C, 'A3'>
export type AnyA3 = A3<Prop, Prop, AnyA3Result>
export const a3 = <P extends Prop, Q extends Prop, C extends A3Result<P, Q>>(
  result: C,
): A3<P, Q, C> => {
  return introduction(result, 'A3')
}
export type ApplyA3<P extends Prop, Q extends Prop> = A3<P, Q, A3Result<P, Q>>
export const applyA3 = <P extends Prop, Q extends Prop>(
  p: P,
  q: Q,
): ApplyA3<P, Q> =>
  a3(
    conclusion(
      implication(implication(negation(p), negation(q)), implication(q, p)),
    ),
  )
export const reverseA3 = <
  P extends Prop,
  Q extends Prop,
  C extends A3Result<P, Q>,
>(
  p: Derivation<C>,
): A3<P, Q, C> => {
  return a3(p.result)
}
export const tryReverseA3 = <C extends AnyConclusion>(
  d: Derivation<C>,
): Derivation<C> | null => {
  return isA3ResultDerivation(d) ? reverseA3(d) : null
}

// Implication

export type MPResult<Q extends Prop> = Conclusion<Q>
export type AnyMPResult = MPResult<Prop>
export const isMPResult: Refinement<AnyConclusion, AnyMPResult> = (
  c: AnyConclusion,
): c is AnyMPResult => true
export const isMPResultDerivation = refineDerivation(isMPResult)
export type MP<
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
> = Transformation<
  C,
  [Derivation<Conclusion<Implication<P, Q>>>, Derivation<Conclusion<P>>],
  'MP'
>
export type AnyMP = MP<Prop, Prop, AnyMPResult>
export const mp = <Q extends Prop, P extends Prop, C extends MPResult<Q>>(
  result: C,
  deps: [Derivation<Conclusion<Implication<P, Q>>>, Derivation<Conclusion<P>>],
): MP<Q, P, C> => transformation(result, deps, 'MP')
export type ApplyMP<
  S1 extends Derivation<
    Conclusion<Implication<S2['result']['succedent'][0], Prop>>
  >,
  S2 extends Derivation<Conclusion<Prop>>,
> =
  S1 extends Derivation<
    Conclusion<Implication<infer P extends Prop, infer Q extends Prop>>
  >
    ? MP<Q, P, MPResult<Q>>
    : never
export const applyMP = <A extends Prop, C extends Prop>(
  s1: Derivation<Conclusion<Implication<A, C>>>,
  s2: Derivation<Conclusion<A>>,
): ApplyMP<
  Derivation<Conclusion<Implication<A & Prop, C>>>,
  Derivation<Conclusion<A>>
> => {
  const a1: A = s1.result.succedent[0].antecedent
  const a2: A = s2.result.succedent[0]
  const _a: A = utils.assertEqual(a1, a2)
  const c: C = s1.result.succedent[0].consequent
  return transformation(conclusion(c), [s1, s2], 'MP')
}
export const reverseMP = <
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
>(
  d: Derivation<C>,
  p: P,
): MP<Q, P, C> => {
  const q: Q = head.head(d.result.succedent)
  const piq: Implication<P, Q> = implication(p, q)
  return mp(d.result, [premise(conclusion(piq)), premise(conclusion(p))])
}
export const tryReverseMP = <C extends AnyConclusion, P extends Prop>(
  d: Derivation<C>,
  p: P,
): Derivation<C> | null => {
  return isMPResultDerivation(d) ? reverseMP(d, p) : null
}

// Language

const alpha = <S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`>(
  s: S,
): Atom<S> => atom(s)
const omega = {
  p0: {},
  p1: { negation },
  p2: { implication },
}
const iota = {
  a1: applyA1,
  a2: applyA2,
  a3: applyA3,
}
const zeta = {
  mp: applyMP,
}

export const meta = {
  name: 'Łukasiewicz Axioms 3',
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
      examples: [[negation(atom('A')), implication(atom('A'), atom('B'))]],
    },
  ],
  rules: [
    {
      title: 'Axioms',
      examples: [
        [
          applyA1(atom('A'), atom('B')),
          applyA2(atom('A'), atom('B'), atom('C')),
          applyA3(atom('A'), atom('B')),
        ],
      ],
    },
    {
      title: 'Rule',
      examples: [
        [
          applyMP(
            premise(conclusion(implication(atom('A'), atom('B')))),
            premise(conclusion(atom('A'))),
          ),
        ],
      ],
    },
  ],
} as const

export const usage = () => print.fromMeta(meta)

export const la3 = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}

export const editBranch = <J extends AnyConclusion>(
  root: Derivation<J> | null,
  path: array.NonEmptyArray<number>,
  edit: <J2 extends AnyConclusion>(d: Derivation<J2>) => Derivation<J2> | null,
): Derivation<J> | null => editBranchG(root, path, edit as Edit)
