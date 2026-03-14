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

export type Axiom1<P extends Prop, Q extends Prop> = Implication<
  P,
  Implication<Q, P>
>
export type AnyAxiom1 = Axiom1<Prop, Prop>
export const isAxiom1: Refinement<Prop, AnyAxiom1> = (p): p is AnyAxiom1 => {
  const piqip = p
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

export type A1Result<P extends Prop, Q extends Prop> = Conclusion<Axiom1<P, Q>>
export type AnyA1Result = A1Result<Prop, Prop>
export const isA1Result: Refinement<AnySequent, AnyA1Result> = (
  s: AnySequent,
): s is AnyA1Result => {
  return isConclusion(s) && isAxiom1(s.succedent[0])
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
export const tryReverseA1 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isA1ResultDerivation(d) ? reverseA1(d) : null
}
export const exampleA1 = applyA1(atom('A'), atom('B'))

export const ruleA1 = {
  isResult: isA1Result,
  isResultDerivation: isA1ResultDerivation,
  make: a1,
  apply: applyA1,
  reverse: reverseA1,
  tryReverse: tryReverseA1,
  example: exampleA1,
} //satisfies Rule<AnyA1Result>
