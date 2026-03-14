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
import { applyA1 } from '../rules/a1'
import { applyA2 } from '../rules/a2'
import { applyA3 } from '../rules/a3'
import { applyMP } from '../rules/mp'

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
