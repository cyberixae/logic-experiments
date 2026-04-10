import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import { Prop, Implication, implication, atom } from '../model/prop'
import * as t from '../model/template'
import {
  Conclusion,
  conclusion,
  AnySequent,
  isConclusion,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import { Rule } from '../model/rule'

export const P = t.Variable('P')
export const Q = t.Variable('Q')
export const R = t.Variable('R')

export const Axiom2 = t.Implication(
  t.Implication(P, t.Implication(Q, R)),
  t.Implication(t.Implication(P, Q), t.Implication(P, R)),
)

export type Axiom2<
  P extends Prop,
  Q extends Prop,
  R extends Prop,
> = Implication<
  Implication<P, Implication<Q, R>>,
  Implication<Implication<P, Q>, Implication<P, R>>
>
export type AnyAxiom2 = Axiom2<Prop, Prop, Prop>
// (p → (q → r)) → ((p → q) → (p → r))
export const isAxiom2: Refinement<Prop, AnyAxiom2> = t.match(Axiom2)
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
> = Introduction<C, 'a2'>
export const a2 = <
  P extends Prop,
  Q extends Prop,
  R extends Prop,
  C extends A2Result<P, Q, R>,
>(
  result: C,
): A2<P, Q, R, C> => {
  return introduction(result, 'a2')
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
  id: 'a2',
  connectives: ['implication'],
  isResult: isA2Result,
  isResultDerivation: isA2ResultDerivation,
  make: a2,
  apply: applyA2,
  reverse: reverseA2,
  tryReverse: tryReverseA2,
  example: exampleA2,
} satisfies Rule<AnyA2Result>
