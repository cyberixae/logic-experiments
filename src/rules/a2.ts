import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import { Prop, Implication, equals, implication, atom } from '../model/prop'
import {
  Conclusion,
  AnyConclusion,
  refineConclusion,
  conclusion,
  AnySequent,
  isConclusion,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import { Rule } from '../model/rule'

export type Axiom2<
  P extends Prop,
  Q extends Prop,
  R extends Prop,
> = Implication<
  Implication<P, Implication<Q, R>>,
  Implication<Implication<P, Q>, Implication<P, R>>
>
export type AnyAxiom2 = Axiom2<Prop, Prop, Prop>
export const isAxiom2: Refinement<Prop, AnyAxiom2> = (p): p is AnyAxiom2 => {
  const piqiripiqipir = p
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
export type A2Result<
  P extends Prop,
  Q extends Prop,
  R extends Prop,
> = Conclusion<Axiom2<P, Q, R>>
export type AnyA2Result = A2Result<Prop, Prop, Prop>
export const isA2Result: Refinement<AnySequent, AnyA2Result> = (
  s: AnySequent,
): s is AnyA2Result => {
  return isConclusion(s) && isAxiom2(s.succedent[0])
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
export const tryReverseA2 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isA2ResultDerivation(d) ? reverseA2(d) : null
}
export const exampleA2 = applyA2(atom('A'), atom('B'), atom('C'))

export const ruleA2 = {
  isResult: isA2Result,
  isResultDerivation: isA2ResultDerivation,
  make: a2,
  apply: applyA2,
  reverse: reverseA2,
  tryReverse: tryReverseA2,
  example: exampleA2,
} //satisfies Rule<AnyA2Result>
