import { Draft } from '../model/draft'
import {
  Printer,
  print,
  printUnary,
  printBinary,
  fromAtom,
  fromFalsum,
  fromVerum,
} from './print'
import * as segment from './segment'

// Renders the inline editor's Draft buffer. Mirrors fromProp's precedence and
// parenthesization so a partially built formula already looks exactly like the
// finished one, holes standing in for the missing subformulas.

const precedence = (d: Draft): number => {
  switch (d.kind) {
    case 'hole':
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

const fromHole = (): Printer => (theme) => {
  const [s0] = theme.hole
  return [segment.hole(s0)]
}

const expand = (minPrec: number, operand: Draft): Printer => {
  if (operand.kind === 'atom' || operand.kind === 'hole')
    return fromDraft(operand)
  return precedence(operand) >= minPrec
    ? print('optional')(fromDraft(operand))
    : print('parenthesis')(fromDraft(operand))
}

export function fromDraft(d: Draft): Printer {
  switch (d.kind) {
    case 'hole':
      return fromHole()
    case 'atom':
      return fromAtom(d)
    case 'falsum':
      return fromFalsum(d)
    case 'verum':
      return fromVerum(d)
    case 'negation':
      return printUnary('negation', false, true)(expand(3, d.negand))
    case 'conjunction':
      return printBinary(
        'conjunction',
        false,
        true,
      )(expand(3, d.leftConjunct), expand(3, d.rightConjunct))
    case 'disjunction':
      return printBinary(
        'disjunction',
        false,
        true,
      )(expand(3, d.leftDisjunct), expand(3, d.rightDisjunct))
    case 'implication':
      return printBinary(
        'implication',
        false,
        true,
      )(expand(2, d.antecedent), expand(2, d.consequent))
  }
}
