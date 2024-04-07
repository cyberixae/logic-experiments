import * as utils from './utils'
import * as prop from './prop'
import * as judge from './judgement'
import * as block from './block'
import { NonEmptyArray, isNonEmptyArray } from './array'
import {
  AnyDerivation,
  AnyPremise,
  AnyTransformation,
} from './derivation'

export type NullaryTemplate = [string]
export const NullaryTemplateId = {
  falsum: null,
  verum: null,
}
export type NullaryTemplateId = keyof typeof NullaryTemplateId
export const isNullaryTemplateId = (s: string): s is NullaryTemplateId =>
  NullaryTemplateId.hasOwnProperty(s)
export type NullaryTemplates = Record<NullaryTemplateId, NullaryTemplate>

export type UnaryTemplate = [string, string]
export const UnaryTemplateId = {
  atom: null,
  optional: null,
  parenthesis: null,
  negation: null,
}
export type UnaryTemplateId = keyof typeof UnaryTemplateId
export const isUnaryTemplateId = (s: string): s is UnaryTemplateId =>
  UnaryTemplateId.hasOwnProperty(s)
export type UnaryTemplates = Record<UnaryTemplateId, UnaryTemplate>

export type BinaryTemplate = [string, string, string]
export const BinaryTemplateId = {
  conjunction: null,
  disjunction: null,
  implication: null,
  formulas: null,
  sequent: null,
}
export type BinaryTemplateId = keyof typeof BinaryTemplateId
export const isBinaryTemplateId = (s: string): s is BinaryTemplateId =>
  BinaryTemplateId.hasOwnProperty(s)
export type BinaryTemplates = Record<BinaryTemplateId, BinaryTemplate>

export type TemplateId = keyof Templates
export type Templates = NullaryTemplates & UnaryTemplates & BinaryTemplates

export const basic: Templates = {
  falsum: ['⊥'],
  verum: ['⊤'],
  atom: ['', ''],
  optional: ['', ''],
  parenthesis: ['(', ')'],
  negation: ['¬', ''],
  conjunction: ['', '∧', ''],
  disjunction: ['', '∨', ''],
  implication: ['', '→', ''],
  formulas: ['', ',', ''],
  sequent: ['', ' ⊢ ', ''],
}

export type Printer = (t: Templates) => string

export const empty = String()

export function printNullary<K extends NullaryTemplateId>(
  key: K,
): () => Printer {
  return () => (theme) => {
    const [s0] = theme[key]
    return s0
  }
}
export function printUnary<K extends UnaryTemplateId>(
  key: K,
): (a: Printer) => Printer {
  return (a) => (theme) => {
    const [s0, s1] = theme[key]
    return [s0, a(theme), s1].join(empty)
  }
}

export function printBinary<K extends BinaryTemplateId>(
  key: K,
): (a: Printer, b: Printer) => Printer {
  return (a, b) => (theme) => {
    const [s0, s1, s2] = theme[key]
    return [s0, a(theme), s1, b(theme), s2].join(empty)
  }
}

export function print<K extends NullaryTemplateId>(
  key: K,
): (...args: []) => Printer
export function print<K extends UnaryTemplateId>(
  key: K,
): (...args: [Printer]) => Printer
export function print<K extends BinaryTemplateId>(
  key: K,
): (...args: [Printer, Printer]) => Printer
export function print<K extends TemplateId>(
  key: K,
): (...args: Array<Printer>) => Printer {
  if (isNullaryTemplateId(key)) {
    return printNullary(key)
  }
  if (isUnaryTemplateId(key)) {
    return printUnary(key)
  }
  if (isBinaryTemplateId(key)) {
    return printBinary(key)
  }
  return utils.assertNever(key)
}

export const printString = (s: string) => () => s

export const printNothing = printString(empty)

/*
export type Combiner = (a: Printer, b: Printer) => Printer
export const concat: Combiner = (a, b) => (theme) => a(theme) + b(theme)

export const concatNonEmptyPrinterArray = ([head, ...tail]: NonEmptyArray<Printer>) => tail.reduce(concat, head)
*/

export function printNonEmptyArray<K extends BinaryTemplateId>(
  k: K,
): (ps: NonEmptyArray<Printer>) => Printer {
  return ([head, ...tail]) => tail.reduce(print(k), head)
}

export function printArray<K extends BinaryTemplateId>(
  k: K,
): (ps: Array<Printer>) => Printer {
  return (ps) =>
    isNonEmptyArray(ps) ? printNonEmptyArray(k)(ps) : printNothing
}

export function fromAtom({ value }: prop.Atom<string>): Printer {
  return print('atom')(printString(value))
}

export function fromFalsum(_falsum: prop.Falsum): Printer {
  return print('falsum')()
}

export function fromVerum(_verum: prop.Verum): Printer {
  return print('verum')()
}

export function fromNegation({ negand }: prop.Negation<prop.Prop>): Printer {
  const expand = (operand: prop.Prop) => {
    switch (operand.kind) {
      case 'atom':
        return fromProp(operand)
      case 'falsum':
      case 'verum':
      case 'negation':
        return print('optional')(fromProp(operand))
      case 'conjunction':
      case 'disjunction':
      case 'implication':
        return print('parenthesis')(fromProp(operand))
    }
  }
  return print('negation')(expand(negand))
}

export function fromConjunction({
  leftConjunct,
  rightConjunct,
}: prop.Conjunction<prop.Prop, prop.Prop>): Printer {
  const expand = (operand: prop.Prop) => {
    switch (operand.kind) {
      case 'atom':
        return fromProp(operand)
      case 'falsum':
      case 'verum':
      case 'negation':
        return print('optional')(fromProp(operand))
      case 'conjunction':
      case 'disjunction':
      case 'implication':
        return print('parenthesis')(fromProp(operand))
    }
  }
  return print('conjunction')(expand(leftConjunct), expand(rightConjunct))
}

export function fromDisjunction({
  leftDisjunct,
  rightDisjunct,
}: prop.Disjunction<prop.Prop, prop.Prop>): Printer {
  const expand = (operand: prop.Prop) => {
    switch (operand.kind) {
      case 'atom':
        return fromProp(operand)
      case 'falsum':
      case 'verum':
      case 'negation':
        return print('optional')(fromProp(operand))
      case 'conjunction':
      case 'disjunction':
      case 'implication':
        return print('parenthesis')(fromProp(operand))
    }
  }
  return print('disjunction')(expand(leftDisjunct), expand(rightDisjunct))
}

export function fromImplication({
  antecedent,
  consequent,
}: prop.Implication<prop.Prop, prop.Prop>): Printer {
  const expand = (operand: prop.Prop) => {
    switch (operand.kind) {
      case 'atom':
        return fromProp(operand)
      case 'falsum':
      case 'verum':
      case 'negation':
      case 'conjunction':
      case 'disjunction':
        return print('optional')(fromProp(operand))
      case 'implication':
        return print('parenthesis')(fromProp(operand))
    }
  }
  return print('implication')(expand(antecedent), expand(consequent))
}

export function fromProp(proposition: prop.Prop): Printer {
  switch (proposition.kind) {
    case 'atom':
      return fromAtom(proposition)
    case 'falsum':
      return fromFalsum(proposition)
    case 'verum':
      return fromVerum(proposition)
    case 'negation':
      return fromNegation(proposition)
    case 'conjunction':
      return fromConjunction(proposition)
    case 'disjunction':
      return fromDisjunction(proposition)
    case 'implication':
      return fromImplication(proposition)
  }
}

export function fromFormulas(formulas: judge.Formulas): Printer {
  return printArray('formulas')(formulas.map(fromProp))
}

export function fromSequent(judgement: judge.AnyJudgement): Printer {
  const { antecedent, succedent } = judgement
  return (t) =>
    print('sequent')(
      fromFormulas(antecedent),
      fromFormulas(succedent),
    )(t).trim()
}

export function left(n: string | null = null): string {
  const l = 'L'
  return n ? l + n : l
}
export function right(n: string | null = null): string {
  const r = 'R'
  return n ? r + n : r
}

export function fromRule(s: string): Printer {
  return (t) => {
    switch (s) {
      case 'cl1':
        return t.conjunction.join(empty) + left('\u2081')
      case 'dr1':
        return t.disjunction.join(empty) + right('\u2081')
      case 'cl2':
        return t.conjunction.join(empty) + left('\u2082')
      case 'dr2':
        return t.disjunction.join(empty) + right('\u2082')
      case 'dl':
        return t.disjunction.join(empty) + left()
      case 'cr':
        return t.conjunction.join(empty) + right()
      case 'il':
        return t.implication.join(empty) + left()
      case 'ir':
        return t.implication.join(empty) + right()
      case 'nl':
        return t.negation.join(empty) + left()
      case 'nr':
        return t.negation.join(empty) + right()
      case 'swl':
        return 'WL'
      case 'swr':
        return 'WR'
      case 'scl':
        return 'CL'
      case 'scr':
        return 'CR'
      case 'srotl':
        return 'RotL'
      case 'srotr':
        return 'RotR'
      case 'sswpl':
        return 'PL'
      case 'sswpr':
        return 'PR'
    }
    return s
  }
}

export function fromPremise({ result }: AnyPremise) {
  return fromSequent(result)(basic)
}

export function fromTransformation({ rule, deps, result }: AnyTransformation) {
  return block.treeAuto(
    fromSequent(result)(basic),
    deps.map(fromDerivation),
    '(' + fromRule(rule)(basic) + ')',
  )
}

export function fromDerivation(treelike: AnyDerivation): string {
  switch (treelike.kind) {
    case 'premise':
      return fromPremise(treelike)
    case 'transformation':
      return fromTransformation(treelike)
  }
}

const unit = 16
const half = block.center(2 * unit)
const full = block.center(4 * unit)

export function fromMeta(meta: any) {
  return block.leftify(
    block.br,
    block.br,
    full(block.underline('*')(meta.name)),
    block.br,
    ...meta.propositions.flatMap(({ title, examples }: any) => [
      block.br,
      title,
      block.br,
      block.br,
      ...examples.flatMap((line: any) => [
        half(
          block.spaced(
            line.map((x: any) => fromProp(x)(basic)),
            1,
          ),
        ),
        block.br,
      ]),
    ]),
    block.br,
    ...meta.rules.flatMap(({ title, examples }: any) => [
      block.br,
      title,
      block.br,
      block.br,
      ...examples.flatMap((line: any) => [
        block.spaced(
          line.map((x: any) => half(fromDerivation(x))),
          0,
        ),
        block.br,
        block.br,
      ]),
    ]),
  )
}
