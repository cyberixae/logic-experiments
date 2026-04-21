import { random, Prop } from '../model/prop'
import { bellRandom } from '../random/challenge'
import { NonEmptyArray, isNonEmptyArray } from '../utils/array'
import {
  SequenceVar,
  SchemaFormula,
  SchemaContext,
  SchemaContextItem,
  SchemaSequent,
  RuleSchema,
} from './schema'
import { QuizConfig } from './config'

// ── Building blocks ────────────────────────────────────────────────────────────

type Blocks = {
  leaves: NonEmptyArray<SchemaFormula>
  binaryOps: string[]
  hasNegation: boolean
  seqVars: SequenceVar[]
}

const buildBlocks = (config: QuizConfig): Blocks | null => {
  const atoms: SchemaFormula[] = config.symbols.map((v) => ({
    kind: 'atom',
    value: v,
  }))
  const vars: SchemaFormula[] = config.variables.map((name) => ({
    kind: 'var',
    name,
  }))
  const constants: SchemaFormula[] = [
    ...(config.connectives.includes('falsum')
      ? [{ kind: 'falsum' as const }]
      : []),
    ...(config.connectives.includes('verum')
      ? [{ kind: 'verum' as const }]
      : []),
  ]
  const allLeaves = [...atoms, ...vars, ...constants]
  if (!isNonEmptyArray(allLeaves)) return null

  return {
    leaves: allLeaves,
    binaryOps: config.connectives.filter(
      (c) => c === 'implication' || c === 'conjunction' || c === 'disjunction',
    ),
    hasNegation: config.connectives.includes('negation'),
    seqVars: config.sequences.map((name) => ({ kind: 'seq', name })),
  }
}

// ── Random schema formula ──────────────────────────────────────────────────────

const pick = <T>(arr: NonEmptyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)] ?? arr[0]

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randomLeaf = (blocks: Blocks): SchemaFormula => pick(blocks.leaves)

const randomSchemaFormula = (blocks: Blocks, maxDepth: number, depth = 0): SchemaFormula => {
  const hasOps = blocks.binaryOps.length > 0 || blocks.hasNegation
  if (depth >= maxDepth || !hasOps || Math.random() < 0.5) {
    return randomLeaf(blocks)
  }
  const ops = [...blocks.binaryOps, ...(blocks.hasNegation ? ['negation'] : [])]
  if (!isNonEmptyArray(ops)) return randomLeaf(blocks)
  const op = pick(ops)
  const next = depth + 1
  switch (op) {
    case 'negation':
      return { kind: 'negation', negand: randomSchemaFormula(blocks, maxDepth, next) }
    case 'implication':
      return {
        kind: 'implication',
        antecedent: randomSchemaFormula(blocks, maxDepth, next),
        consequent: randomSchemaFormula(blocks, maxDepth, next),
      }
    case 'conjunction':
      return {
        kind: 'conjunction',
        leftConjunct: randomSchemaFormula(blocks, maxDepth, next),
        rightConjunct: randomSchemaFormula(blocks, maxDepth, next),
      }
    default:
      return {
        kind: 'disjunction',
        leftDisjunct: randomSchemaFormula(blocks, maxDepth, next),
        rightDisjunct: randomSchemaFormula(blocks, maxDepth, next),
      }
  }
}

// ── Context and sequent generation ────────────────────────────────────────────

const randomPremiseContext = (
  blocks: Blocks,
  seqVar: SequenceVar | null,
  contextSize: number,
  formulaSize: number,
): SchemaContext => {
  const count = contextSize > 0 ? bellRandom(1, contextSize) : 0
  const items: SchemaFormula[] = Array.from({ length: count }, () =>
    randomSchemaFormula(blocks, formulaSize),
  )
  if (seqVar === null) return items
  const pos = randomInt(0, items.length)
  const result: SchemaContextItem[] = [...items]
  result.splice(pos, 0, seqVar)
  return result
}

const randomConclusionContext = (
  blocks: Blocks,
  knownSeqVars: SequenceVar[],
  contextSize: number,
  formulaSize: number,
): SchemaContext => {
  const items: SchemaContextItem[] = []
  const count = contextSize > 0 ? bellRandom(1, contextSize) : 0
  for (let i = 0; i < count; i += 1) {
    if (isNonEmptyArray(knownSeqVars) && Math.random() < 0.5) {
      items.push(pick(knownSeqVars))
    } else {
      items.push(randomSchemaFormula(blocks, formulaSize))
    }
  }
  return items
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

const randomPremise = (
  blocks: Blocks,
  usedSeqVars: Set<string>,
  contextSize: number,
  formulaSize: number,
): SchemaSequent => {
  const seqAnt =
    blocks.seqVars.length > 0 && Math.random() < 0.6
      ? pickUnusedSeqVar(blocks.seqVars, usedSeqVars)
      : null
  const seqSuc =
    blocks.seqVars.length > 0 && Math.random() < 0.6
      ? pickUnusedSeqVar(blocks.seqVars, usedSeqVars)
      : null
  return {
    antecedent: randomPremiseContext(blocks, seqAnt, contextSize, formulaSize),
    succedent: randomPremiseContext(blocks, seqSuc, contextSize, formulaSize),
  }
}

const randomConclusion = (
  blocks: Blocks,
  usedSeqVars: Set<string>,
  contextSize: number,
  formulaSize: number,
): SchemaSequent => {
  const known = blocks.seqVars.filter((v) => usedSeqVars.has(v.name))
  return {
    antecedent: randomConclusionContext(blocks, known, contextSize, formulaSize),
    succedent: randomConclusionContext(blocks, known, contextSize, formulaSize),
  }
}

const generateBaseSchema = (blocks: Blocks, premiseCounts: number[], contextSize: number, formulaSize: number): RuleSchema => {
  const allowed = premiseCounts.length > 0 ? premiseCounts : [0, 1, 2]
  const premiseCount = allowed[Math.floor(Math.random() * allowed.length)] ?? 0
  const usedSeqVars = new Set<string>()
  const premises: SchemaSequent[] = []
  for (let i = 0; i < premiseCount; i += 1) {
    premises.push(randomPremise(blocks, usedSeqVars, contextSize, formulaSize))
  }
  return {
    name: '',
    premises,
    conclusion: randomConclusion(blocks, usedSeqVars, contextSize, formulaSize),
  }
}

// ── Schema traversal utilities ─────────────────────────────────────────────────

const mapFormula = (
  f: SchemaFormula,
  fn: (f: SchemaFormula) => SchemaFormula,
): SchemaFormula => {
  const cur = fn(f)
  switch (cur.kind) {
    case 'var':
    case 'atom':
    case 'falsum':
    case 'verum':
      return cur
    case 'negation':
      return { kind: 'negation', negand: mapFormula(cur.negand, fn) }
    case 'implication':
      return {
        kind: 'implication',
        antecedent: mapFormula(cur.antecedent, fn),
        consequent: mapFormula(cur.consequent, fn),
      }
    case 'conjunction':
      return {
        kind: 'conjunction',
        leftConjunct: mapFormula(cur.leftConjunct, fn),
        rightConjunct: mapFormula(cur.rightConjunct, fn),
      }
    case 'disjunction':
      return {
        kind: 'disjunction',
        leftDisjunct: mapFormula(cur.leftDisjunct, fn),
        rightDisjunct: mapFormula(cur.rightDisjunct, fn),
      }
  }
}

const mapRuleFormulas = (
  rule: RuleSchema,
  fn: (f: SchemaFormula) => SchemaFormula,
): RuleSchema => {
  const mapCtx = (ctx: SchemaContext): SchemaContext =>
    ctx.map((item) => (item.kind === 'seq' ? item : mapFormula(item, fn)))
  const mapSeq = (seq: SchemaSequent): SchemaSequent => ({
    antecedent: mapCtx(seq.antecedent),
    succedent: mapCtx(seq.succedent),
  })
  return {
    ...rule,
    premises: rule.premises.map(mapSeq),
    conclusion: mapSeq(rule.conclusion),
  }
}

const mapRuleSeqVars = (
  rule: RuleSchema,
  fn: (item: SequenceVar) => SchemaContextItem,
): RuleSchema => {
  const mapCtx = (ctx: SchemaContext): SchemaContext =>
    ctx.map((item) => (item.kind === 'seq' ? fn(item) : item))
  const mapSeq = (seq: SchemaSequent): SchemaSequent => ({
    antecedent: mapCtx(seq.antecedent),
    succedent: mapCtx(seq.succedent),
  })
  return {
    ...rule,
    premises: rule.premises.map(mapSeq),
    conclusion: mapSeq(rule.conclusion),
  }
}

// Collect unique values of a kind from the schema
const collectAtoms = (rule: RuleSchema): string[] => {
  const found = new Set<string>()
  const visit = (f: SchemaFormula) => {
    if (f.kind === 'atom') found.add(f.value)
    else if (f.kind === 'negation') visit(f.negand)
    else if (f.kind === 'implication') {
      visit(f.antecedent)
      visit(f.consequent)
    } else if (f.kind === 'conjunction') {
      visit(f.leftConjunct)
      visit(f.rightConjunct)
    } else if (f.kind === 'disjunction') {
      visit(f.leftDisjunct)
      visit(f.rightDisjunct)
    }
  }
  const visitCtx = (ctx: SchemaContext) => {
    for (const item of ctx) {
      if (item.kind !== 'seq') visit(item)
    }
  }
  const visitSeq = (seq: SchemaSequent) => {
    visitCtx(seq.antecedent)
    visitCtx(seq.succedent)
  }
  for (const p of rule.premises) visitSeq(p)
  visitSeq(rule.conclusion)
  return [...found]
}

const collectFormulaVars = (rule: RuleSchema): string[] => {
  const found = new Set<string>()
  const visit = (f: SchemaFormula) => {
    if (f.kind === 'var') found.add(f.name)
    else if (f.kind === 'negation') visit(f.negand)
    else if (f.kind === 'implication') {
      visit(f.antecedent)
      visit(f.consequent)
    } else if (f.kind === 'conjunction') {
      visit(f.leftConjunct)
      visit(f.rightConjunct)
    } else if (f.kind === 'disjunction') {
      visit(f.leftDisjunct)
      visit(f.rightDisjunct)
    }
  }
  const visitCtx = (ctx: SchemaContext) => {
    for (const item of ctx) {
      if (item.kind !== 'seq') visit(item)
    }
  }
  const visitSeq = (seq: SchemaSequent) => {
    visitCtx(seq.antecedent)
    visitCtx(seq.succedent)
  }
  for (const p of rule.premises) visitSeq(p)
  visitSeq(rule.conclusion)
  return [...found]
}

const collectSeqVars = (rule: RuleSchema): string[] => {
  const found = new Set<string>()
  const visitCtx = (ctx: SchemaContext) => {
    for (const item of ctx) {
      if (item.kind === 'seq') found.add(item.name)
    }
  }
  const visitSeq = (seq: SchemaSequent) => {
    visitCtx(seq.antecedent)
    visitCtx(seq.succedent)
  }
  for (const p of rule.premises) visitSeq(p)
  visitSeq(rule.conclusion)
  return [...found]
}

const collectBinaryConnectives = (rule: RuleSchema): string[] => {
  const found = new Set<string>()
  const visit = (f: SchemaFormula) => {
    if (
      f.kind === 'implication' ||
      f.kind === 'conjunction' ||
      f.kind === 'disjunction'
    ) {
      found.add(f.kind)
    }
    if (f.kind === 'negation') visit(f.negand)
    else if (f.kind === 'implication') {
      visit(f.antecedent)
      visit(f.consequent)
    } else if (f.kind === 'conjunction') {
      visit(f.leftConjunct)
      visit(f.rightConjunct)
    } else if (f.kind === 'disjunction') {
      visit(f.leftDisjunct)
      visit(f.rightDisjunct)
    }
  }
  const visitCtx = (ctx: SchemaContext) => {
    for (const item of ctx) {
      if (item.kind !== 'seq') visit(item)
    }
  }
  const visitSeq = (seq: SchemaSequent) => {
    visitCtx(seq.antecedent)
    visitCtx(seq.succedent)
  }
  for (const p of rule.premises) visitSeq(p)
  visitSeq(rule.conclusion)
  return [...found]
}

// ── Mutations ──────────────────────────────────────────────────────────────────

const ALL_BINARY = ['implication', 'conjunction', 'disjunction']

const trySubstituteAtom = (
  rule: RuleSchema,
  config: QuizConfig,
): RuleSchema | null => {
  const present = collectAtoms(rule)
  if (!isNonEmptyArray(present)) return null
  const from = pick(present)
  const candidates = config.symbols.filter((s) => s !== from)
  if (!isNonEmptyArray(candidates)) return null
  const to = pick(candidates)
  return mapRuleFormulas(rule, (f) =>
    f.kind === 'atom' && f.value === from ? { kind: 'atom', value: to } : f,
  )
}

const trySubstituteFormulaVar = (rule: RuleSchema): RuleSchema | null => {
  const present = collectFormulaVars(rule)
  if (!isNonEmptyArray(present)) return null
  const from = pick(present)
  // Only substitute with a variable already present — renaming to a fresh variable
  // is always isomorphic (any binding can be reproduced by rebinding the new name)
  const candidates = present.filter((v) => v !== from)
  if (!isNonEmptyArray(candidates)) return null
  const to = pick(candidates)
  return mapRuleFormulas(rule, (f) =>
    f.kind === 'var' && f.name === from ? { kind: 'var', name: to } : f,
  )
}

const trySubstituteSeqVar = (rule: RuleSchema): RuleSchema | null => {
  const present = collectSeqVars(rule)
  if (!isNonEmptyArray(present)) return null
  const from = pick(present)
  // Only substitute with a sequence var already present — renaming to a fresh variable
  // is always isomorphic (any binding can be reproduced by rebinding the new name)
  const candidates = present.filter((s) => s !== from)
  if (!isNonEmptyArray(candidates)) return null
  const to = pick(candidates)
  return mapRuleSeqVars(rule, (item) =>
    item.name === from ? { kind: 'seq', name: to } : item,
  )
}

const trySubstituteConnective = (
  rule: RuleSchema,
  config: QuizConfig,
): RuleSchema | null => {
  const present = collectBinaryConnectives(rule)
  if (!isNonEmptyArray(present)) return null
  const from = pick(present)
  const available = config.connectives.filter(
    (c) => ALL_BINARY.includes(c) && c !== from,
  )
  if (!isNonEmptyArray(available)) return null
  const to = pick(available)
  return mapRuleFormulas(rule, (f) => {
    let a: SchemaFormula | undefined
    let b: SchemaFormula | undefined
    if (f.kind === 'implication' && from === 'implication') {
      a = f.antecedent
      b = f.consequent
    } else if (f.kind === 'conjunction' && from === 'conjunction') {
      a = f.leftConjunct
      b = f.rightConjunct
    } else if (f.kind === 'disjunction' && from === 'disjunction') {
      a = f.leftDisjunct
      b = f.rightDisjunct
    }
    if (a === undefined || b === undefined) return f
    if (to === 'implication')
      return { kind: 'implication', antecedent: a, consequent: b }
    if (to === 'conjunction')
      return { kind: 'conjunction', leftConjunct: a, rightConjunct: b }
    return { kind: 'disjunction', leftDisjunct: a, rightDisjunct: b }
  })
}

const tryAddRemovePremise = (
  rule: RuleSchema,
  blocks: Blocks,
  premiseCounts: number[],
  contextSize: number,
  formulaSize: number,
): RuleSchema | null => {
  const allowed = premiseCounts.length > 0 ? premiseCounts : [0, 1, 2]
  const canAdd = allowed.includes(rule.premises.length + 1)
  const canRemove = allowed.includes(rule.premises.length - 1)
  if (!canAdd && !canRemove) return null
  const doAdd = canAdd && (!canRemove || (rule.premises.length < 2 && Math.random() >= 0.5))
  if (doAdd) {
    const usedSeqVars = new Set(collectSeqVars(rule))
    return { ...rule, premises: [...rule.premises, randomPremise(blocks, usedSeqVars, contextSize, formulaSize)] }
  }
  return { ...rule, premises: rule.premises.slice(0, -1) }
}

const schemaKey = (rule: RuleSchema): string =>
  JSON.stringify({
    premises: rule.premises,
    conclusion: rule.conclusion,
  })

const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = result[i]
    const b = result[j]
    if (a !== undefined && b !== undefined) {
      result[i] = b
      result[j] = a
    }
  }
  return result
}

const generateDistractors = (
  base: RuleSchema,
  config: QuizConfig,
  blocks: Blocks,
  count: number,
): RuleSchema[] => {
  const used = new Set([schemaKey(base)])
  const distractors: RuleSchema[] = []
  const mutators = [
    () => trySubstituteAtom(base, config),
    () => trySubstituteFormulaVar(base),
    () => trySubstituteSeqVar(base),
    () => trySubstituteConnective(base, config),
    () => tryAddRemovePremise(base, blocks, config.premiseCounts, config.contextSize, config.formulaSize),
  ]

  let attempts = 0
  while (distractors.length < count && attempts < 50) {
    attempts += 1
    const mutatorList = shuffle(mutators)
    for (const mutate of mutatorList) {
      const result = mutate()
      if (result === null) continue
      const key = schemaKey(result)
      if (used.has(key)) continue
      used.add(key)
      distractors.push(result)
      break
    }
  }

  // Fill remaining slots with fresh schemas if mutations exhausted
  while (distractors.length < count) {
    const fresh = generateBaseSchema(blocks, config.premiseCounts, config.contextSize, config.formulaSize)
    const key = schemaKey(fresh)
    if (!used.has(key)) {
      used.add(key)
      distractors.push(fresh)
    }
  }

  return distractors
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  schemas: RuleSchema[]
  answerIndex: number
}

export const generatePreviewSchemas = (config: QuizConfig, count: number): RuleSchema[] => {
  const blocks = buildBlocks(config)
  if (blocks === null) return []
  return Array.from({ length: count }, (_, i) => ({
    ...generateBaseSchema(blocks, config.premiseCounts, config.contextSize, config.formulaSize),
    name: `${i + 1}`,
  }))
}

export const generateQuestion = (config: QuizConfig): QuizQuestion | null => {
  const blocks = buildBlocks(config)
  if (blocks === null) return null

  const base = generateBaseSchema(blocks, config.premiseCounts, config.contextSize, config.formulaSize)
  const distractors = generateDistractors(base, config, blocks, 3)
  const all = shuffle([base, ...distractors])
  const answerIndex = all.indexOf(base)

  return {
    schemas: all.map((s, i) => ({ ...s, name: `${i + 1}` })),
    answerIndex,
  }
}

// ── Instantiation ──────────────────────────────────────────────────────────────

type FormulaBinding = Map<string, Prop>
type SequenceBinding = Map<string, Prop[]>

const instantiateFormula = (f: SchemaFormula, fb: FormulaBinding, formulaSize: number): Prop => {
  switch (f.kind) {
    case 'var': {
      let val = fb.get(f.name)
      if (val === undefined) {
        val = random(bellRandom(0, formulaSize))()
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
      return { kind: 'negation', negand: instantiateFormula(f.negand, fb, formulaSize) }
    case 'implication':
      return {
        kind: 'implication',
        antecedent: instantiateFormula(f.antecedent, fb, formulaSize),
        consequent: instantiateFormula(f.consequent, fb, formulaSize),
      }
    case 'conjunction':
      return {
        kind: 'conjunction',
        leftConjunct: instantiateFormula(f.leftConjunct, fb, formulaSize),
        rightConjunct: instantiateFormula(f.rightConjunct, fb, formulaSize),
      }
    case 'disjunction':
      return {
        kind: 'disjunction',
        leftDisjunct: instantiateFormula(f.leftDisjunct, fb, formulaSize),
        rightDisjunct: instantiateFormula(f.rightDisjunct, fb, formulaSize),
      }
  }
}

const instantiateContext = (
  ctx: SchemaContext,
  fb: FormulaBinding,
  sb: SequenceBinding,
  formulaSize: number,
): Prop[] => {
  const result: Prop[] = []
  for (const item of ctx) {
    if (item.kind === 'seq') {
      let val = sb.get(item.name)
      if (val === undefined) {
        val = Array.from({ length: randomInt(0, 2) }, () => random(bellRandom(0, formulaSize))())
        sb.set(item.name, val)
      }
      result.push(...val)
    } else {
      result.push(instantiateFormula(item, fb, formulaSize))
    }
  }
  return result
}

export type InstantiatedSequent = { antecedent: Prop[]; succedent: Prop[] }
export type InstantiatedRule = {
  premises: InstantiatedSequent[]
  conclusion: InstantiatedSequent
}

export const instantiate = (schema: RuleSchema, formulaSize: number = 2): InstantiatedRule => {
  const fb: FormulaBinding = new Map()
  const sb: SequenceBinding = new Map()
  const instantiateSeq = (s: SchemaSequent): InstantiatedSequent => ({
    antecedent: instantiateContext(s.antecedent, fb, sb, formulaSize),
    succedent: instantiateContext(s.succedent, fb, sb, formulaSize),
  })
  return {
    premises: schema.premises.map(instantiateSeq),
    conclusion: instantiateSeq(schema.conclusion),
  }
}
