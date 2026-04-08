import * as utils from '../utils/utils'
import * as prop from '../model/prop'
import * as judge from '../model/sequent'
import * as block from './block'
import { NonEmptyArray, isNonEmptyArray } from '../utils/array'
import {
  AnyDerivation,
  AnyPremise,
  AnyTransformation,
} from '../model/derivation'
import { Focus } from '../interactive/focus'
import { AnySequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import * as rule from '../model/rule'
import * as segment from './segment'
import { leftLogical, rightLogical, rules as ruleRegistry } from '../rules'

export type NullaryTemplate = [string]
export const NullaryTemplateId = {
  falsum: null,
  verum: null,
}
export type NullaryTemplateId = keyof typeof NullaryTemplateId
export const isNullaryTemplateId = (s: string): s is NullaryTemplateId =>
  s in NullaryTemplateId
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
  s in UnaryTemplateId
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
  s in BinaryTemplateId
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

export type Printer = (t: Templates) => segment.Segments

export const empty = String()

export function printNullary<K extends NullaryTemplateId>(
  key: K,
): () => Printer {
  return () => (theme) => {
    const [s0] = theme[key]
    return [segment.of(s0)]
  }
}
export function printUnary<K extends UnaryTemplateId>(
  key: K,
  activeConn = false,
  markConnective = false,
): (a: Printer) => Printer {
  return (a) => (theme) => {
    const [s0, s1] = theme[key]
    return [
      markConnective
        ? segment.connective(s0, activeConn)
        : activeConn
          ? segment.active(s0)
          : segment.of(s0),
      ...a(theme),
      segment.of(s1),
    ]
  }
}

export function printBinary<K extends BinaryTemplateId>(
  key: K,
  activeConn = false,
  markConnective = false,
): (a: Printer, b: Printer) => Printer {
  return (a, b) => (theme) => {
    const [s0, s1, s2] = theme[key]
    return [
      segment.of(s0),
      ...a(theme),
      markConnective
        ? segment.connective(s1, activeConn)
        : activeConn
          ? segment.active(s1)
          : segment.of(s1),
      ...b(theme),
      segment.of(s2),
    ]
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

export const printString =
  (s: string): Printer =>
  (_theme) => [segment.of(s)]

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
  let chr = value
  if (value === 'p') {
    chr = '\u{1f427}'
  }
  if (value === 'q') {
    chr = '\u{1f99c}'
  }
  if (value === 'r') {
    chr = '\u{1f983}'
  }
  if (value === 's') {
    chr = '\u{1f986}'
  }
  return print('atom')(printString(chr))
}

export function fromFalsum(_falsum: prop.Falsum): Printer {
  return print('falsum')()
}

export function fromVerum(_verum: prop.Verum): Printer {
  return print('verum')()
}

export function fromNegation(
  { negand }: prop.Negation<prop.Prop>,
  activeConnective = false,
): Printer {
  const expand = (operand: prop.Prop): Printer => {
    const optional = () => print('optional')(fromProp(operand))
    const parenthesized = () => print('parenthesis')(fromProp(operand))
    return prop.matchRaw(operand, {
      atom: fromProp,
      falsum: optional,
      verum: optional,
      negation: optional,
      conjunction: parenthesized,
      disjunction: parenthesized,
      implication: parenthesized,
    })
  }
  return printUnary('negation', activeConnective, true)(expand(negand))
}

export function fromConjunction(
  { leftConjunct, rightConjunct }: prop.Conjunction<prop.Prop, prop.Prop>,
  activeConnective = false,
): Printer {
  const expand = (operand: prop.Prop): Printer => {
    const optional = () => print('optional')(fromProp(operand))
    const parenthesized = () => print('parenthesis')(fromProp(operand))
    return prop.matchRaw(operand, {
      atom: fromProp,
      falsum: optional,
      verum: optional,
      negation: optional,
      conjunction: parenthesized,
      disjunction: parenthesized,
      implication: parenthesized,
    })
  }
  return printBinary(
    'conjunction',
    activeConnective,
    true,
  )(expand(leftConjunct), expand(rightConjunct))
}

export function fromDisjunction(
  { leftDisjunct, rightDisjunct }: prop.Disjunction<prop.Prop, prop.Prop>,
  activeConnective = false,
): Printer {
  const expand = (operand: prop.Prop): Printer => {
    const optional = () => print('optional')(fromProp(operand))
    const parenthesized = () => print('parenthesis')(fromProp(operand))
    return prop.matchRaw(operand, {
      atom: fromProp,
      falsum: optional,
      verum: optional,
      negation: optional,
      conjunction: parenthesized,
      disjunction: parenthesized,
      implication: parenthesized,
    })
  }
  return printBinary(
    'disjunction',
    activeConnective,
    true,
  )(expand(leftDisjunct), expand(rightDisjunct))
}

export function fromImplication(
  { antecedent, consequent }: prop.Implication<prop.Prop, prop.Prop>,
  activeConnective = false,
): Printer {
  const expand = (operand: prop.Prop): Printer => {
    const optional = () => print('optional')(fromProp(operand))
    const parenthesized = () => print('parenthesis')(fromProp(operand))
    return prop.matchRaw(operand, {
      atom: fromProp,
      falsum: optional,
      verum: optional,
      negation: optional,
      conjunction: optional,
      disjunction: optional,
      implication: parenthesized,
    })
  }
  return printBinary(
    'implication',
    activeConnective,
    true,
  )(expand(antecedent), expand(consequent))
}

export function fromProp(
  proposition: prop.Prop,
  activeConnective = false,
): Printer {
  return prop.matchRaw(proposition, {
    atom: fromAtom,
    falsum: fromFalsum,
    verum: fromVerum,
    negation: (p) => fromNegation(p, activeConnective),
    conjunction: (p) => fromConjunction(p, activeConnective),
    disjunction: (p) => fromDisjunction(p, activeConnective),
    implication: (p) => fromImplication(p, activeConnective),
  })
}

export function fromFormulas(formulas: Formulas): Printer {
  return printArray('formulas')(formulas.map((f) => fromProp(f)))
}

export function fromSequent(
  judgement: judge.AnySequent,
  ruleIds: ReadonlyArray<rule.RuleId> = [],
): Printer {
  const { antecedent, succedent } = judgement

  const activeLeft = ruleIds.some(
    (id) => id in leftLogical && ruleRegistry[id].isResult(judgement),
  )
  const activeRight = ruleIds.some(
    (id) => id in rightLogical && ruleRegistry[id].isResult(judgement),
  )

  const antPrinters = antecedent.map((f, i) =>
    activeLeft && i === antecedent.length - 1 ? fromProp(f, true) : fromProp(f),
  )
  const sucPrinters = succedent.map((f, i) =>
    activeRight && i === 0 ? fromProp(f, true) : fromProp(f),
  )

  return (t) =>
    segment.trim(
      print('sequent')(
        printArray('formulas')(antPrinters),
        printArray('formulas')(sucPrinters),
      )(t),
    )
}

export function left(n: string | null = null): string {
  const l = 'L'
  return n != null ? l + n : l
}
export function right(n: string | null = null): string {
  const r = 'R'
  return n != null ? r + n : r
}

export function fromRuleId(s: rule.RuleId): Printer {
  return (t) => [
    segment.of(
      rule.matchRuleId(s, {
        i: () => 'I',
        f: () => '⊥',
        v: () => '⊤',
        cl: () => t.conjunction.join(empty) + left(),
        dr: () => t.disjunction.join(empty) + right(),
        cl1: () => t.conjunction.join(empty) + left('\u2081'),
        dr1: () => t.disjunction.join(empty) + right('\u2081'),
        cl2: () => t.conjunction.join(empty) + left('\u2082'),
        dr2: () => t.disjunction.join(empty) + right('\u2082'),
        dl: () => t.disjunction.join(empty) + left(),
        cr: () => t.conjunction.join(empty) + right(),
        il: () => t.implication.join(empty) + left(),
        ir: () => t.implication.join(empty) + right(),
        nl: () => t.negation.join(empty) + left(),
        nr: () => t.negation.join(empty) + right(),
        swl: () => 'WL',
        swr: () => 'WR',
        scl: () => 'CL',
        scr: () => 'CR',
        sRotLF: () => '\u21B6L',
        sRotRF: () => '\u21b7R',
        sRotLB: () => '\u21b7L',
        sRotRB: () => '\u21B6R',
        sxl: () => 'XL',
        sxr: () => 'XR',
        a1: () => 'a1',
        a2: () => 'a2',
        a3: () => 'a3',
        cut: () => 'cut',
        fcut: () => 'fcut',
        fcr: () => t.conjunction.join(empty) + right('ᶠ'),
        fdl: () => t.disjunction.join(empty) + left('ᶠ'),
        fil: () => t.implication.join(empty) + left('ᶠ'),
        mp: () => 'mp',
      }),
    ),
  ]
}

export function fromPremise({ result }: AnyPremise) {
  return segment.plain(fromSequent(result)(basic))
}

export function fromTransformation({ rule, deps, result }: AnyTransformation) {
  return block.treeAuto(
    segment.plain(fromSequent(result)(basic)),
    deps.map(fromDerivation),
    '(' + segment.plain(fromRuleId(rule)(basic)) + ')',
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

type MetaSection<T> = {
  readonly title: string
  readonly examples: ReadonlyArray<ReadonlyArray<T>>
}
type Meta = {
  readonly name: string
  readonly propositions: ReadonlyArray<MetaSection<prop.Prop>>
  readonly rules: ReadonlyArray<MetaSection<AnyDerivation>>
}

export function fromMeta(meta: Meta) {
  return block.leftify(
    block.br,
    block.br,
    full(block.underline('*')(meta.name)),
    block.br,
    ...meta.propositions.flatMap(({ title, examples }) => [
      block.br,
      title,
      block.br,
      block.br,
      ...examples.flatMap((line) => [
        half(
          block.spaced(
            line.map((x) => segment.plain(fromProp(x)(basic))),
            1,
          ),
        ),
        block.br,
      ]),
    ]),
    block.br,
    ...meta.rules.flatMap(({ title, examples }) => [
      block.br,
      title,
      block.br,
      block.br,
      ...examples.flatMap((line) => [
        block.spaced(
          line.map((x) => half(fromDerivation(x))),
          0,
        ),
        block.br,
        block.br,
      ]),
    ]),
  )
}
export const fromFocus = (s: Focus<AnySequent>) => {
  return fromDerivation(s.derivation)
}
