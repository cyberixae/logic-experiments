import {
  refineDerivation,
  Introduction,
  introduction,
  Derivation,
} from '../model/derivation'
import {
  Prop,
  Implication,
  Negation,
  implication,
  negation,
  atom,
} from '../model/prop'
import * as t from '../model/template'
import {
  Conclusion,
  AnySequent,
  conclusion,
  isConclusion,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import { Rule } from '../model/rule'

export const P = t.Variable('P')
export const Q = t.Variable('Q')

export const Axiom3 = t.Implication(
  t.Implication(t.Negation(P), t.Negation(Q)),
  t.Implication(Q, P),
)
export type Axiom3<P extends Prop, Q extends Prop> = Implication<
  Implication<Negation<P>, Negation<Q>>,
  Implication<Q, P>
>

export type AnyAxiom3 = Axiom3<Prop, Prop>
// (¬p → ¬q) → (q → p)
export const isAxiom3: Refinement<Prop, AnyAxiom3> = t.match(Axiom3)
export type A3Result<P extends Prop, Q extends Prop> = Conclusion<Axiom3<P, Q>>
export type AnyA3Result = A3Result<Prop, Prop>
export const isA3Result: Refinement<AnySequent, AnyA3Result> = (
  s: AnySequent,
): s is AnyA3Result => {
  return isConclusion(s) && isAxiom3(s.succedent[0])
}
export const isA3ResultDerivation = refineDerivation(isA3Result)
export type A3<
  P extends Prop,
  Q extends Prop,
  C extends A3Result<P, Q>,
> = Introduction<C, 'a3'>
export type AnyA3 = A3<Prop, Prop, AnyA3Result>
export const a3 = <P extends Prop, Q extends Prop, C extends A3Result<P, Q>>(
  result: C,
): A3<P, Q, C> => {
  return introduction(result, 'a3')
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
export const tryReverseA3 = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isA3ResultDerivation(d) ? reverseA3(d) : null
}
export const exampleA3 = applyA3(atom('A'), atom('B'))

export const ruleA3 = {
  id: 'a3',
  connectives: ['implication', 'negation'],
  isResult: isA3Result,
  isResultDerivation: isA3ResultDerivation,
  make: a3,
  apply: applyA3,
  reverse: reverseA3,
  tryReverse: tryReverseA3,
  example: exampleA3,
} satisfies Rule<AnyA3Result>
