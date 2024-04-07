import * as prop from '../lib/prop'
import * as array from '../lib/array'
import * as utils from '../lib/utils'
import * as print from '../lib/print'
import {
  Formulas,
  Judgement as Sequent,
  judgement as sequent,
  judgement,
} from '../lib/judgement'
import {
  AnyDerivation,
  Derivation,
  Introduction,
  transformation,
  introduction,
  Transformation,
  premise,
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
export const i = <A extends Prop>(a: A): I<A> =>
  introduction(sequent([a], [a]), 'I')

// Cut

export type Cut<
  S1 extends AnyDerivation,
  S2 extends AnyDerivation,
> = Transformation<
  S1 extends Derivation<Sequent<infer Γ, [...infer Δ extends Formulas, Prop]>>
    ? S2 extends Derivation<
        Sequent<[Prop, ...infer Σ extends Formulas], infer Π>
      >
      ? Sequent<[...Γ, ...Σ], [...Δ, ...Π]>
      : never
    : never,
  [S1, S2],
  'Cut'
>
export const cut = <
  Γ extends Formulas,
  Δ extends Formulas,
  Σ extends Formulas,
  Π extends Formulas,
>(
  s1: Derivation<Sequent<Γ, [...Δ, Prop]>>,
  s2: Derivation<Sequent<[Prop, ...Σ], Π>>,
) => {
  const γ: Γ = s1.result.antecedent
  const δ: Δ = array.init(s1.result.succedent)
  const π: Π = s2.result.succedent
  const ς: Σ = array.tail(s2.result.antecedent)
  return transformation(sequent([...γ, ...ς], [...δ, ...π]), [s1, s2], 'Cut')
}

// Conjunction & Disjunction

export type Cl1<B extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? Sequent<[...Γ, Conjunction<A, B>], Δ>
    : never,
  [S],
  'cl1'
>
export const cl1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): Cl1<B, Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, conjunction(a, b)], δ), [s], 'cl1')
}

export type Dr1<B extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? Sequent<Γ, [Disjunction<A, B>, ...Δ]>
    : never,
  [S],
  'dr1'
>
export const dr1 = <
  B extends Prop,
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
>(
  b: B,
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): Dr1<B, Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const a: A = array.head(s.result.succedent)
  return transformation(sequent(γ, [disjunction(a, b), ...δ]), [s], 'dr1')
}

export type Cl2<A extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer B extends Prop], infer Δ>
  >
    ? Sequent<[...Γ, Conjunction<A, B>], Δ>
    : never,
  [S],
  'cl2'
>
export const cl2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<[...Γ, B], Δ>>,
): Cl2<A, Derivation<Sequent<[...Γ, B], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const b: B = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, conjunction(a, b)], δ), [s], 'cl2')
}

export type DR2<A extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<infer Γ, [infer B extends Prop, ...infer Δ extends Formulas]>
  >
    ? Sequent<Γ, [Disjunction<A, B>, ...Δ]>
    : never,
  [S],
  'dr2'
>
export const dr2 = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, [B, ...Δ]>>,
): DR2<A, Derivation<Sequent<Γ, [B, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const b: B = array.head(s.result.succedent)
  return transformation(sequent(γ, [disjunction(a, b), ...δ]), [s], 'dr2')
}

export type DL<
  S1 extends AnyDerivation,
  S2 extends AnyDerivation,
> = Transformation<
  S1 extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? S2 extends Derivation<
        Sequent<[...infer Σ extends Formulas, infer B extends Prop], infer Π>
      >
      ? Sequent<[...Γ, ...Σ, Disjunction<A, B>], [...Δ, ...Π]>
      : never
    : never,
  [S1, S2],
  'dl'
>
export const dl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
>(
  s1: Derivation<Sequent<[...Γ, A], Δ>>,
  s2: Derivation<Sequent<[...Σ, B], Π>>,
): DL<Derivation<Sequent<[...Γ, A], Δ>>, Derivation<Sequent<[...Σ, B], Π>>> => {
  const γ: Γ = array.init(s1.result.antecedent)
  const ς: Σ = array.init(s2.result.antecedent)
  const a: A = array.last(s1.result.antecedent)
  const b: B = array.last(s2.result.antecedent)
  const δ: Δ = s1.result.succedent
  const π: Π = s2.result.succedent
  return transformation(
    sequent([...γ, ...ς, disjunction(a, b)], [...δ, ...π]),
    [s1, s2],
    'dl',
  )
}

export type CR<
  S1 extends AnyDerivation,
  S2 extends AnyDerivation,
> = Transformation<
  S1 extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? S2 extends Derivation<
        Sequent<infer Σ, [infer B extends Prop, ...infer Π extends Formulas]>
      >
      ? Sequent<[...Γ, ...Σ], [Conjunction<A, B>, ...Δ, ...Π]>
      : never
    : never,
  [S1, S2],
  'cr'
>
export const cr = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
>(
  s1: Derivation<Sequent<Γ, [A, ...Δ]>>,
  s2: Derivation<Sequent<Σ, [B, ...Π]>>,
): CR<Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<Σ, [B, ...Π]>>> => {
  const γ: Γ = s1.result.antecedent
  const ς: Σ = s2.result.antecedent
  const a: A = array.head(s1.result.succedent)
  const b: B = array.head(s2.result.succedent)
  const δ: Δ = array.tail(s1.result.succedent)
  const π: Π = array.tail(s2.result.succedent)
  return transformation(
    sequent([...γ, ...ς], [conjunction(a, b), ...δ, ...π]),
    [s1, s2],
    'cr',
  )
}

// Implication

export type IL<
  S1 extends AnyDerivation,
  S2 extends AnyDerivation,
> = Transformation<
  S1 extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? S2 extends Derivation<
        Sequent<[...infer Σ extends Formulas, infer B extends Prop], infer Π>
      >
      ? Sequent<[...Γ, ...Σ, Implication<A, B>], [...Δ, ...Π]>
      : never
    : never,
  [S1, S2],
  'il'
>
export const il = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  Σ extends Formulas,
  B extends Prop,
  Π extends Formulas,
>(
  s1: Derivation<Sequent<Γ, [A, ...Δ]>>,
  s2: Derivation<Sequent<[...Σ, B], Π>>,
): IL<Derivation<Sequent<Γ, [A, ...Δ]>>, Derivation<Sequent<[...Σ, B], Π>>> => {
  const γ: Γ = s1.result.antecedent
  const ς: Σ = array.init(s2.result.antecedent)
  const a: A = array.head(s1.result.succedent)
  const b: B = array.last(s2.result.antecedent)
  const δ: Δ = array.tail(s1.result.succedent)
  const π: Π = s2.result.succedent
  return transformation(
    sequent([...γ, ...ς, implication(a, b)], [...δ, ...π]),
    [s1, s2],
    'il',
  )
}

export type IR<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop],
      [infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? Sequent<Γ, [Implication<A, B>, ...Δ]>
    : never,
  [S],
  'ir'
>
export const ir = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A], [B, ...Δ]>>,
): IR<Derivation<Sequent<[...Γ, A], [B, ...Δ]>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const b: B = array.head(s.result.succedent)
  const δ: Δ = array.tail(s.result.succedent)
  return transformation(sequent(γ, [implication(a, b), ...δ]), [s], 'ir')
}

// Negation

export type NL<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? Sequent<[...Γ, Negation<A>], Δ>
    : never,
  [S],
  'nl'
>
export const nl = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): NL<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a: A = array.head(s.result.succedent)
  const δ: Δ = array.tail(s.result.succedent)
  return transformation(sequent([...γ, negation(a)], δ), [s], 'nl')
}

export type NR<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<[...infer Γ extends Formulas, infer A extends Prop], infer Δ>
  >
    ? Sequent<Γ, [Negation<A>, ...Δ]>
    : never,
  [S],
  'nr'
>
export const nr = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<[...Γ, A], Δ>>,
): NR<Derivation<Sequent<[...Γ, A], Δ>>> => {
  const γ: Γ = array.init(s.result.antecedent)
  const a: A = array.last(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent(γ, [negation(a), ...δ]), [s], 'nr')
}

// Weakening

export type SWL<A extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<Sequent<infer Γ, infer Δ>>
    ? Sequent<[...Γ, A], Δ>
    : never,
  [S],
  'swl'
>
export const swl = <A extends Prop, Γ extends Formulas, Δ extends Formulas>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>,
): SWL<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'swl')
}

export type SWR<A extends Prop, S extends AnyDerivation> = Transformation<
  S extends Derivation<Sequent<infer Γ, infer Δ>>
    ? Sequent<Γ, [A, ...Δ]>
    : never,
  [S],
  'swr'
>
export const swr = <A extends Prop, Γ extends Formulas, Δ extends Formulas>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>,
): SWR<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = s.result.succedent
  return transformation(sequent(γ, [a, ...δ]), [s], 'swr')
}

// Contraction

export type SCL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> = Transformation<
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer A extends Prop],
      infer Δ
    >
  >
    ? Sequent<[...Γ, A], Δ>
    : never,
  [S],
  'scl'
>
export const scl = <Γ extends Formulas, Δ extends Formulas, A extends Prop>(
  s: Derivation<Sequent<[...Γ, A, A], Δ>>,
): SCL<Derivation<Sequent<[...Γ, A, A], Δ>>> => {
  const γ: Γ = array.init(array.init(s.result.antecedent))
  const a1: A = array.last(s.result.antecedent)
  const a2: A = array.last(array.init(s.result.antecedent))
  const a: A = utils.assertEqual(a1, a2)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'scl')
}

export type SCR<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> = Transformation<
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer A extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? Sequent<Γ, [A, ...Δ]>
    : never,
  [S],
  'scr'
>
export const scr = <Γ extends Formulas, Δ extends Formulas, A extends Prop>(
  s: Derivation<Sequent<Γ, [A, A, ...Δ]>>,
): SCR<Derivation<Sequent<Γ, [A, A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const a1: A = array.head(s.result.succedent)
  const a2: A = array.head(array.tail(s.result.succedent))
  const a: A = utils.assertEqual(a1, a2)
  const δ: Δ = array.tail(array.tail(s.result.succedent))
  return transformation(sequent(γ, [a, ...δ]), [s], 'scr')
}

// Permutation

export type Srotl<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<[infer A extends Prop, ...infer Γ extends Formulas], infer Δ>
  >
    ? Sequent<[...Γ, A], Δ>
    : never,
  [S],
  'srotl'
>
export const srotl = <A extends Prop, Γ extends Formulas, Δ extends Formulas>(
  s: Derivation<Sequent<[A, ...Γ], Δ>>,
): Srotl<Derivation<Sequent<[A, ...Γ], Δ>>> => {
  const γ: Γ = array.tail(s.result.antecedent)
  const a: A = array.head(s.result.antecedent)
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, a], δ), [s], 'srotl')
}

export type Srotr<S extends AnyDerivation> = Transformation<
  S extends Derivation<
    Sequent<infer Γ, [infer A extends Prop, ...infer Δ extends Formulas]>
  >
    ? Sequent<Γ, [...Δ, A]>
    : never,
  [S],
  'srotr'
>
export const srotr = <Γ extends Formulas, A extends Prop, Δ extends Formulas>(
  s: Derivation<Sequent<Γ, [A, ...Δ]>>,
): Srotr<Derivation<Sequent<Γ, [A, ...Δ]>>> => {
  const γ: Γ = s.result.antecedent
  const δ: Δ = array.tail(s.result.succedent)
  const a: A = array.head(s.result.succedent)
  return transformation(sequent(γ, [...δ, a]), [s], 'srotr')
}

export type Sswpl<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>,
> = Transformation<
  S extends Derivation<
    Sequent<
      [...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop],
      infer Δ
    >
  >
    ? Sequent<[...Γ, B, A], Δ>
    : never,
  [S],
  'sswpl'
>
export const sswpl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A, B], Δ>>,
): Sswpl<Derivation<Sequent<[...Γ, A, B], Δ>>> => {
  const γ: Γ = array.init(array.init(s.result.antecedent))
  const b: B = array.last(s.result.antecedent)
  const a: A = array.last(array.init(s.result.antecedent))
  const δ: Δ = s.result.succedent
  return transformation(sequent([...γ, b, a], δ), [s], 'sswpl')
}

export type Sswpr<
  S extends Derivation<Sequent<Formulas, [Prop, Prop, ...Formulas]>>,
> = Transformation<
  S extends Derivation<
    Sequent<
      infer Γ,
      [infer A extends Prop, infer B extends Prop, ...infer Δ extends Formulas]
    >
  >
    ? Sequent<Γ, [B, A, ...Δ]>
    : never,
  [S],
  'sswpr'
>
export const sswpr = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<Γ, [A, B, ...Δ]>>,
): Sswpr<Derivation<Sequent<Γ, [A, B, ...Δ]>>> => {
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
  cut,
  cl1,
  dr1,
  cl2,
  dr2,
  dl,
  cr,
  il,
  ir,
  nl,
  nr,
  swl,
  swr,
  scl,
  scr,
  srotl,
  srotr,
  sswpl,
  sswpr,
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
      examples: [[i(atom('A'))]],
    },
    {
      title: 'Cut',
      examples: [
        [
          cut(
            premise(judgement([atom('Γ')], [atom('Δ'), atom('A')])),
            premise(judgement([atom('A'), atom('Σ')], [atom('Π')])),
          ),
        ],
      ],
    },
    {
      title: 'Logical Rules',
      examples: [
        [
          cl1(
            atom('B'),
            premise(judgement([atom('Γ'), atom('A')], [atom('Δ')])),
          ),
          dr1(
            atom('B'),
            premise(judgement([atom('Γ')], [atom('A'), atom('Δ')])),
          ),
        ],
        [
          cl2(
            atom('A'),
            premise(judgement([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
          dr2(
            atom('A'),
            premise(judgement([atom('Γ'), atom('B')], [atom('Δ')])),
          ),
        ],
        [
          dl(
            premise(judgement([atom('Γ'), atom('A')], [atom('Δ')])),
            premise(judgement([atom('Σ'), atom('B')], [atom('Π')])),
          ),
          cr(
            premise(judgement([atom('Γ')], [atom('A'), atom('Δ')])),
            premise(judgement([atom('Σ')], [atom('B'), atom('Π')])),
          ),
        ],
        [
          il(
            premise(judgement([atom('Γ')], [atom('A'), atom('Δ')])),
            premise(judgement([atom('Σ'), atom('B')], [atom('Π')])),
          ),
          ir(
            premise(judgement([atom('Γ'), atom('A')], [atom('B'), atom('Δ')])),
          ),
        ],
        [
          nl(premise(judgement([atom('Γ')], [atom('A'), atom('Δ')]))),
          nr(premise(judgement([atom('Γ'), atom('A')], [atom('Δ')]))),
        ],
      ],
    },
    {
      title: 'Structural Rules',
      examples: [
        [
          swl(atom('A'), premise(judgement([atom('Γ')], [atom('Δ')]))),
          swr(atom('A'), premise(judgement([atom('Γ')], [atom('Δ')]))),
        ],
        [
          scl(
            premise(judgement([atom('Γ'), atom('A'), atom('A')], [atom('Δ')])),
          ),
          scr(
            premise(judgement([atom('Γ')], [atom('A'), atom('A'), atom('Δ')])),
          ),
        ],
        [
          srotl(premise(judgement([atom('Σ'), atom('A')], [atom('Π')]))),
          srotr(premise(judgement([atom('Σ')], [atom('A'), atom('Π')]))),
        ],
        [
          sswpl(
            premise(judgement([atom('Σ'), atom('A'), atom('B')], [atom('Π')])),
          ),
          sswpr(
            premise(judgement([atom('Σ')], [atom('A'), atom('B'), atom('Π')])),
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
