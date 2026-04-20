export type FormulaVar = { kind: 'var'; name: string }
export type SequenceVar = { kind: 'seq'; name: string }

export type SchemaFormula =
  | FormulaVar
  | { kind: 'atom'; value: string }
  | { kind: 'falsum' }
  | { kind: 'verum' }
  | { kind: 'negation'; negand: SchemaFormula }
  | {
      kind: 'implication'
      antecedent: SchemaFormula
      consequent: SchemaFormula
    }
  | {
      kind: 'conjunction'
      leftConjunct: SchemaFormula
      rightConjunct: SchemaFormula
    }
  | {
      kind: 'disjunction'
      leftDisjunct: SchemaFormula
      rightDisjunct: SchemaFormula
    }

// Items in a sequent context: formulas or sequence variables interleaved freely.
// Generation constraint (not encoded in types):
//   each side of a premise sequent: at most one SequenceVar
//   conclusion sides: unconstrained — vars may repeat and appear anywhere
export type SchemaContextItem = SchemaFormula | SequenceVar
export type SchemaContext = SchemaContextItem[]

export type SchemaSequent = {
  antecedent: SchemaContext
  succedent: SchemaContext
}

export type RuleSchema = {
  name: string
  premises: SchemaSequent[]
  conclusion: SchemaSequent
}
