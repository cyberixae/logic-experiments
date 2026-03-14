import { Prop, Atom, Negation, Implication, atom, negation, implication } from '../model/prop'
import * as array from '../utils/array'
import { AnyConclusion, conclusion, isActiveR } from '../model/sequent'
import * as print from '../render/print'
import {
  Derivation,
  premise,
  editDerivation as editBranchG,
  toProof,
  Edit,
} from '../model/derivation'
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

const alpha = <S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`>(
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
          ruleA1.example,
          ruleA2.example,
          ruleA3.example,
        ],
      ],
    },
    {
      title: 'Rule',
      examples: [
        [
          ruleMP.example,
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
