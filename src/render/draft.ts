import { Draft } from '../model/draft'
import { AnySequent } from '../model/sequent'
import {
  Printer,
  print,
  printArray,
  printUnary,
  printBinary,
  fromAtom,
  fromFalsum,
  fromProp,
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

const spliceSequent = (ant: Printer[], suc: Printer[]): Printer => {
  const p = print('sequent')(
    printArray('formulas')(ant),
    printArray('formulas')(suc),
  )
  return (theme) => segment.trim(p(theme))
}

// The conjecture entry's live preview: the draft as the sole succedent of an
// otherwise empty sequent — the goal `⊢ φ` the player is composing.
export const conjectureGhost = (d: Draft): Printer =>
  spliceSequent([], [fromDraft(d)])

// The two premises of a reverse cut on `goal` with the draft as the lemma:
// prove-it (goal succedent extended with the draft) and use-it (the draft
// assumed at the head of the antecedent). Rendered like fromSequent, with the
// draft spliced in where the finished formula will land on confirm.
export const lemmaGhostPremises = (
  goal: AnySequent,
  d: Draft,
): [Printer, Printer] => {
  const ant = goal.antecedent.map((f) => fromProp(f))
  const suc = goal.succedent.map((f) => fromProp(f))
  return [
    spliceSequent(ant, [...suc, fromDraft(d)]),
    spliceSequent([fromDraft(d), ...ant], suc),
  ]
}
