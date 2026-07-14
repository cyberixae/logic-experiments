import {
  Atom,
  Falsum,
  Verum,
  Prop,
  negation,
  implication,
  conjunction,
  disjunction,
} from './prop'

// Edit buffer for the inline formula editor: a formula whose leaves may still
// be unfilled holes. Deliberately not part of the Prop language — the proof
// tree never holds a Draft; a completed Draft leaves the editor as a Prop via
// toProp.

export interface Hole {
  kind: 'hole'
}
export const hole: Hole = { kind: 'hole' }

export interface DraftNegation {
  kind: 'negation'
  negand: Draft
}
export const draftNegation = (negand: Draft): DraftNegation => ({
  kind: 'negation',
  negand,
})

export interface DraftImplication {
  kind: 'implication'
  antecedent: Draft
  consequent: Draft
}
export const draftImplication = (
  antecedent: Draft,
  consequent: Draft,
): DraftImplication => ({
  kind: 'implication',
  antecedent,
  consequent,
})

export interface DraftConjunction {
  kind: 'conjunction'
  leftConjunct: Draft
  rightConjunct: Draft
}
export const draftConjunction = (
  leftConjunct: Draft,
  rightConjunct: Draft,
): DraftConjunction => ({
  kind: 'conjunction',
  leftConjunct,
  rightConjunct,
})

export interface DraftDisjunction {
  kind: 'disjunction'
  leftDisjunct: Draft
  rightDisjunct: Draft
}
export const draftDisjunction = (
  leftDisjunct: Draft,
  rightDisjunct: Draft,
): DraftDisjunction => ({
  kind: 'disjunction',
  leftDisjunct,
  rightDisjunct,
})

export type Draft =
  | Hole
  | Atom<string>
  | Falsum
  | Verum
  | DraftNegation
  | DraftImplication
  | DraftConjunction
  | DraftDisjunction

// Fills the leftmost hole with the given piece and returns the new Draft, or
// null when the draft has no hole left to fill.
export const fillLeftmost = (d: Draft, filler: Draft): Draft | null => {
  switch (d.kind) {
    case 'hole':
      return filler
    case 'atom':
    case 'falsum':
    case 'verum':
      return null
    case 'negation': {
      const negand = fillLeftmost(d.negand, filler)
      return negand === null ? null : draftNegation(negand)
    }
    case 'implication': {
      const antecedent = fillLeftmost(d.antecedent, filler)
      if (antecedent !== null) return draftImplication(antecedent, d.consequent)
      const consequent = fillLeftmost(d.consequent, filler)
      return consequent === null
        ? null
        : draftImplication(d.antecedent, consequent)
    }
    case 'conjunction': {
      const leftConjunct = fillLeftmost(d.leftConjunct, filler)
      if (leftConjunct !== null)
        return draftConjunction(leftConjunct, d.rightConjunct)
      const rightConjunct = fillLeftmost(d.rightConjunct, filler)
      return rightConjunct === null
        ? null
        : draftConjunction(d.leftConjunct, rightConjunct)
    }
    case 'disjunction': {
      const leftDisjunct = fillLeftmost(d.leftDisjunct, filler)
      if (leftDisjunct !== null)
        return draftDisjunction(leftDisjunct, d.rightDisjunct)
      const rightDisjunct = fillLeftmost(d.rightDisjunct, filler)
      return rightDisjunct === null
        ? null
        : draftDisjunction(d.leftDisjunct, rightDisjunct)
    }
  }
}

// One palette press: fill the draft's leftmost hole with the piece — or,
// when the draft is already complete, wrap it as the piece's first operand
// (pressing an operator on a finished formula extends it at the root:
// `p` then `→` gives `p → ▢`). Atoms never wrap since they have no hole to
// receive the draft; both directions failing returns null.
export const fillOrWrap = (d: Draft, piece: Draft): Draft | null => {
  const filled = fillLeftmost(d, piece)
  return filled !== null ? filled : fillLeftmost(piece, d)
}

// The finished proposition, or null while holes remain.
export const toProp = (d: Draft): Prop | null => {
  switch (d.kind) {
    case 'hole':
      return null
    case 'atom':
    case 'falsum':
    case 'verum':
      return d
    case 'negation': {
      const negand = toProp(d.negand)
      return negand === null ? null : negation(negand)
    }
    case 'implication': {
      const antecedent = toProp(d.antecedent)
      const consequent = toProp(d.consequent)
      return antecedent === null || consequent === null
        ? null
        : implication(antecedent, consequent)
    }
    case 'conjunction': {
      const leftConjunct = toProp(d.leftConjunct)
      const rightConjunct = toProp(d.rightConjunct)
      return leftConjunct === null || rightConjunct === null
        ? null
        : conjunction(leftConjunct, rightConjunct)
    }
    case 'disjunction': {
      const leftDisjunct = toProp(d.leftDisjunct)
      const rightDisjunct = toProp(d.rightDisjunct)
      return leftDisjunct === null || rightDisjunct === null
        ? null
        : disjunction(leftDisjunct, rightDisjunct)
    }
  }
}

export const isComplete = (d: Draft): boolean => toProp(d) !== null
