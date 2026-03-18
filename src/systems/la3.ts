import {
  Prop,
  Atom,
  Negation,
  Implication,
  atom,
  negation,
  implication,
} from '../model/prop'
import { ruleA1 } from '../rules/a1'
import { ruleA2 } from '../rules/a2'
import { ruleA3 } from '../rules/a3'
import { ruleMP } from '../rules/mp'

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

// Language

export const alpha = <
  S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`,
>(
  s: S,
): Atom<S> => atom(s)
const omega = {
  p0: {},
  p1: { negation },
  p2: { implication },
}
const iota = {
  a1: ruleA1.apply,
  a2: ruleA2.apply,
  a3: ruleA3.apply,
}
const zeta = {
  mp: ruleMP.apply,
}

export const name = 'Łukasiewicz Axioms 3'

export const la3 = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}
