import * as prop from '../lib/prop'
import * as utils from '../lib/utils'
import { Conclusion, conclusion } from '../lib/judgement'
import * as print from '../lib/print'
import {
  introduction,
  Introduction,
  Derivation,
  transformation,
  premise,
  Transformation,
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

export type Prop = Atom<string> | Negation<Prop> | Implication<Prop, Prop>

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

export type A1<P extends Prop, Q extends Prop> = Introduction<
  Conclusion<Implication<P, Implication<Q, P>>>,
  'A1'
>
export const a1 = <P extends Prop, Q extends Prop>(p: P, q: Q): A1<P, Q> =>
  introduction(conclusion(implication(p, implication(q, p))), 'A1')

export type A2<P extends Prop, Q extends Prop, R extends Prop> = Introduction<
  Conclusion<
    Implication<
      Implication<P, Implication<Q, R>>,
      Implication<Implication<P, Q>, Implication<P, R>>
    >
  >,
  'A2'
>
export const a2 = <P extends Prop, Q extends Prop, R extends Prop>(
  p: P,
  q: Q,
  r: R,
): A2<P, Q, R> =>
  introduction(
    conclusion(
      implication(
        implication(p, implication(q, r)),
        implication(implication(p, q), implication(p, r)),
      ),
    ),
    'A2',
  )

export type A3<P extends Prop, Q extends Prop> = Introduction<
  Conclusion<
    Implication<Implication<Negation<P>, Negation<Q>>, Implication<Q, P>>
  >,
  'A3'
>
export const a3 = <P extends Prop, Q extends Prop>(p: P, q: Q): A3<P, Q> =>
  introduction(
    conclusion(
      implication(implication(negation(p), negation(q)), implication(q, p)),
    ),
    'A3',
  )

// Implication

export type MP<
  S1 extends Derivation<
    Conclusion<Implication<S2['result']['succedent'][0], Prop>>
  >,
  S2 extends Derivation<Conclusion<Prop>>,
> = Transformation<
  S1 extends Derivation<Conclusion<Implication<Prop, infer Q extends Prop>>>
    ? Conclusion<Q>
    : never,
  [S1, S2],
  'MP'
>
export const mp = <A extends Prop, C extends Prop>(
  s1: Derivation<Conclusion<Implication<A, C>>>,
  s2: Derivation<Conclusion<A>>,
): MP<
  Derivation<Conclusion<Implication<A & Prop, C>>>,
  Derivation<Conclusion<A>>
> => {
  const a1: A = s1.result.succedent[0].antecedent
  const a2: A = s2.result.succedent[0]
  const _a: A = utils.assertEqual(a1, a2)
  const c: C = s1.result.succedent[0].consequent
  return transformation(conclusion(c), [s1, s2], 'MP')
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
  a1,
  a2,
  a3,
}
const zeta = {
  mp,
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
          a1(atom('A'), atom('B')),
          a2(atom('A'), atom('B'), atom('C')),
          a3(atom('A'), atom('B')),
        ],
      ],
    },
    {
      title: 'Rule',
      examples: [
        [
          mp(
            premise(conclusion(implication(atom('A'), atom('B')))),
            premise(conclusion(atom('A'))),
          ),
        ],
      ],
    },
  ],
} as const

export const usage = print.fromMeta(meta)

export const la3 = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}
