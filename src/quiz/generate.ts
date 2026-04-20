import { random, Prop } from '../model/prop'
import { NonEmptyArray, isNonEmptyArray } from '../utils/array'
import {
  SequenceVar,
  SchemaFormula,
  SchemaContext,
  SchemaContextItem,
  SchemaSequent,
  RuleSchema,
} from './schema'

const FORMULA_VAR_NAMES: NonEmptyArray<string> = ['A', 'B', 'C', 'D']
const SEQUENCE_VAR_NAMES: NonEmptyArray<string> = ['Γ', 'Δ', 'Σ', 'Π']
const ATOM_NAMES: NonEmptyArray<string> = ['p', 'q', 'r']
const RULE_NAMES: NonEmptyArray<string> = ['R1', 'R2', 'R3', 'R4']

const pick = <T>(arr: NonEmptyArray<T>): T => {
  const i = Math.floor(Math.random() * arr.length)
  return arr[i] ?? arr[0]
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randomSchemaFormula = (
  formulaVarNames: string[],
  depth = 0,
): SchemaFormula => {
  const maxDepth = 2
  const rand = Math.random()
  if (depth >= maxDepth || rand < 0.5) {
    if (Math.random() < 0.6 && isNonEmptyArray(formulaVarNames)) {
      const v: SchemaFormula = { kind: 'var', name: pick(formulaVarNames) }
      return v
    }
    if (Math.random() < 0.8) {
      return { kind: 'atom', value: pick(ATOM_NAMES) }
    }
    return Math.random() < 0.5 ? { kind: 'falsum' } : { kind: 'verum' }
  }
  const next = depth + 1
  if (rand < 0.65) {
    return {
      kind: 'implication',
      antecedent: randomSchemaFormula(formulaVarNames, next),
      consequent: randomSchemaFormula(formulaVarNames, next),
    }
  }
  if (rand < 0.8) {
    return {
      kind: 'negation',
      negand: randomSchemaFormula(formulaVarNames, next),
    }
  }
  if (rand < 0.9) {
    return {
      kind: 'conjunction',
      leftConjunct: randomSchemaFormula(formulaVarNames, next),
      rightConjunct: randomSchemaFormula(formulaVarNames, next),
    }
  }
  return {
    kind: 'disjunction',
    leftDisjunct: randomSchemaFormula(formulaVarNames, next),
    rightDisjunct: randomSchemaFormula(formulaVarNames, next),
  }
}

// Build a premise context side: 1-3 formula items + optionally one sequence var at a random position
const randomPremiseContext = (
  formulaVarNames: string[],
  seqVar: SequenceVar | null,
): SchemaContext => {
  const count = randomInt(1, 3)
  const items: SchemaFormula[] = Array.from({ length: count }, () =>
    randomSchemaFormula(formulaVarNames),
  )
  if (seqVar === null) return items
  const pos = randomInt(0, items.length)
  const result: SchemaContextItem[] = [...items]
  result.splice(pos, 0, seqVar)
  return result
}

// Build a conclusion context side: use known sequence vars (possibly repeating) + formula vars
const randomConclusionContext = (
  formulaVarNames: string[],
  knownSeqVars: SequenceVar[],
): SchemaContext => {
  const items: SchemaContextItem[] = []
  const count = randomInt(1, 3)
  for (let i = 0; i < count; i += 1) {
    if (isNonEmptyArray(knownSeqVars) && Math.random() < 0.5) {
      items.push(pick(knownSeqVars))
    } else {
      items.push(randomSchemaFormula(formulaVarNames))
    }
  }
  return items
}

const randomSchemaSequent = (
  formulaVarNames: string[],
  seqVarPool: SequenceVar[],
  usedSeqVars: Set<string>,
  isPremise: boolean,
): SchemaSequent => {
  if (isPremise) {
    const useSeqAnt = Math.random() < 0.6
    const useSeqSuc = Math.random() < 0.6
    const seqAnt = useSeqAnt ? pickUnusedSeqVar(seqVarPool, usedSeqVars) : null
    const seqSuc = useSeqSuc ? pickUnusedSeqVar(seqVarPool, usedSeqVars) : null
    return {
      antecedent: randomPremiseContext(formulaVarNames, seqAnt),
      succedent: randomPremiseContext(formulaVarNames, seqSuc),
    }
  }
  const knownSeqVars = seqVarPool.filter((v) => usedSeqVars.has(v.name))
  return {
    antecedent: randomConclusionContext(formulaVarNames, knownSeqVars),
    succedent: randomConclusionContext(formulaVarNames, knownSeqVars),
  }
}

const pickUnusedSeqVar = (
  pool: SequenceVar[],
  used: Set<string>,
): SequenceVar | null => {
  const available = pool.filter((v) => !used.has(v.name))
  if (!isNonEmptyArray(available)) return null
  const v = pick(available)
  used.add(v.name)
  return v
}

const randomRuleSchema = (name: string): RuleSchema => {
  const premiseCount = randomInt(0, 2)
  const formulaVarNames = FORMULA_VAR_NAMES.slice(0, randomInt(1, 3))
  const seqVarPool: SequenceVar[] = SEQUENCE_VAR_NAMES.slice(
    0,
    randomInt(1, 4),
  ).map((n) => ({ kind: 'seq', name: n }))
  const usedSeqVars = new Set<string>()

  const premises: SchemaSequent[] = []
  for (let i = 0; i < premiseCount; i += 1) {
    premises.push(
      randomSchemaSequent(formulaVarNames, seqVarPool, usedSeqVars, true),
    )
  }
  const conclusion = randomSchemaSequent(
    formulaVarNames,
    seqVarPool,
    usedSeqVars,
    false,
  )
  return { name, premises, conclusion }
}

export const randomRuleSchemas = (): RuleSchema[] =>
  RULE_NAMES.map((name) => randomRuleSchema(name))

// ── Instantiation ──────────────────────────────────────────────────────────────

type FormulaBinding = Map<string, Prop>
type SequenceBinding = Map<string, Prop[]>

const instantiateFormula = (
  f: SchemaFormula,
  fb: FormulaBinding,
): Prop => {
  switch (f.kind) {
    case 'var': {
      let val = fb.get(f.name)
      if (val === undefined) {
        val = random(2)()
        fb.set(f.name, val)
      }
      return val
    }
    case 'atom':
      return { kind: 'atom', value: f.value }
    case 'falsum':
      return { kind: 'falsum' }
    case 'verum':
      return { kind: 'verum' }
    case 'negation':
      return { kind: 'negation', negand: instantiateFormula(f.negand, fb) }
    case 'implication':
      return {
        kind: 'implication',
        antecedent: instantiateFormula(f.antecedent, fb),
        consequent: instantiateFormula(f.consequent, fb),
      }
    case 'conjunction':
      return {
        kind: 'conjunction',
        leftConjunct: instantiateFormula(f.leftConjunct, fb),
        rightConjunct: instantiateFormula(f.rightConjunct, fb),
      }
    case 'disjunction':
      return {
        kind: 'disjunction',
        leftDisjunct: instantiateFormula(f.leftDisjunct, fb),
        rightDisjunct: instantiateFormula(f.rightDisjunct, fb),
      }
  }
}

const instantiateContext = (
  ctx: SchemaContext,
  fb: FormulaBinding,
  sb: SequenceBinding,
): Prop[] => {
  const result: Prop[] = []
  for (const item of ctx) {
    if (item.kind === 'seq') {
      let val = sb.get(item.name)
      if (val === undefined) {
        val = Array.from({ length: randomInt(0, 2) }, () => random(1)())
        sb.set(item.name, val)
      }
      result.push(...val)
    } else {
      result.push(instantiateFormula(item, fb))
    }
  }
  return result
}

export type InstantiatedSequent = { antecedent: Prop[]; succedent: Prop[] }
export type InstantiatedRule = {
  premises: InstantiatedSequent[]
  conclusion: InstantiatedSequent
}

export const instantiate = (schema: RuleSchema): InstantiatedRule => {
  const fb: FormulaBinding = new Map()
  const sb: SequenceBinding = new Map()
  const instantiateSeq = (s: SchemaSequent): InstantiatedSequent => ({
    antecedent: instantiateContext(s.antecedent, fb, sb),
    succedent: instantiateContext(s.succedent, fb, sb),
  })
  return {
    premises: schema.premises.map(instantiateSeq),
    conclusion: instantiateSeq(schema.conclusion),
  }
}
