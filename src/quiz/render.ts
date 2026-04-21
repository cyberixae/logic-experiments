import { SchemaFormula, SchemaContext, SchemaSequent, RuleSchema } from './schema'
import {
  Printer,
  printUnary,
  printBinary,
  printArray,
  fromAtom,
  fromFalsum,
  fromVerum,
  basic,
} from '../render/print'
import * as segment from '../render/segment'
import * as block from '../render/block'

function fromSchemaFormula(f: SchemaFormula): Printer {
  switch (f.kind) {
    case 'var':
      return fromAtom({ kind: 'atom', value: f.name })
    case 'atom':
      return fromAtom({ kind: 'atom', value: f.value })
    case 'falsum':
      return fromFalsum({ kind: 'falsum' })
    case 'verum':
      return fromVerum({ kind: 'verum' })
    case 'negation':
      return printUnary('negation', false, true)(expandSchema(3, f.negand))
    case 'conjunction':
      return printBinary('conjunction', false, true)(
        expandSchema(3, f.leftConjunct),
        expandSchema(3, f.rightConjunct),
      )
    case 'disjunction':
      return printBinary('disjunction', false, true)(
        expandSchema(3, f.leftDisjunct),
        expandSchema(3, f.rightDisjunct),
      )
    case 'implication':
      return printBinary('implication', false, true)(
        expandSchema(2, f.antecedent),
        expandSchema(2, f.consequent),
      )
  }
}

const schemaPrecedence = (f: SchemaFormula): number => {
  switch (f.kind) {
    case 'var':
    case 'atom':
    case 'falsum':
    case 'verum':
      return 4
    case 'negation':
      return 3
    case 'conjunction':
    case 'disjunction':
      return 2
    case 'implication':
      return 1
  }
}

function expandSchema(minPrec: number, f: SchemaFormula): Printer {
  if (f.kind === 'atom' || f.kind === 'var') return fromSchemaFormula(f)
  return schemaPrecedence(f) >= minPrec
    ? printUnary('optional')(fromSchemaFormula(f))
    : printUnary('parenthesis')(fromSchemaFormula(f))
}

export const fromSchemaContext = (ctx: SchemaContext): Printer =>
  printArray('formulas')(
    ctx.map((item) =>
      item.kind === 'seq'
        ? fromAtom({ kind: 'atom', value: item.name })
        : fromSchemaFormula(item),
    ),
  )

export const fromSchemaSequent = (s: SchemaSequent): Printer =>
  (t) =>
    segment.trim(
      printBinary('sequent')(
        fromSchemaContext(s.antecedent),
        fromSchemaContext(s.succedent),
      )(t),
    )

const schemaSequentText = (s: SchemaSequent): string =>
  segment.plain(fromSchemaSequent(s)(basic))

export const fromSchemaRule = (schema: RuleSchema, showLabel = true): string =>
  block.treeAuto(
    schemaSequentText(schema.conclusion),
    schema.premises.map(schemaSequentText),
    showLabel ? '(' + schema.name + ')' : null,
  )
