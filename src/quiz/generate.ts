import { random, randomWeighted, Prop } from '../model/prop'
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
  instance: InstantiatedRule,
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
      if (canMatchInstance(result, instance)) continue
      used.add(key)
      distractors.push(result)
      break
    }
  }

  // Fill remaining slots with fresh schemas if mutations exhausted
  let fallbackAttempts = 0
  while (distractors.length < count && fallbackAttempts < 50) {
    fallbackAttempts += 1
    const fresh = generateBaseSchema(blocks, config.premiseCounts, config.contextSize, config.formulaSize)
    const key = schemaKey(fresh)
    if (!used.has(key) && !canMatchInstance(fresh, instance)) {
      used.add(key)
      distractors.push(fresh)
    }
  }

  return distractors
}

// ── Schema-to-instance unification ────────────────────────────────────────────

const propsEqual = (a: Prop, b: Prop): boolean => {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'atom':
      return b.kind === 'atom' && a.value === b.value
    case 'falsum':
    case 'verum':
      return true
    case 'negation':
      return b.kind === 'negation' && propsEqual(a.negand, b.negand)
    case 'implication':
      return (
        b.kind === 'implication' &&
        propsEqual(a.antecedent, b.antecedent) &&
        propsEqual(a.consequent, b.consequent)
      )
    case 'conjunction':
      return (
        b.kind === 'conjunction' &&
        propsEqual(a.leftConjunct, b.leftConjunct) &&
        propsEqual(a.rightConjunct, b.rightConjunct)
      )
    case 'disjunction':
      return (
        b.kind === 'disjunction' &&
        propsEqual(a.leftDisjunct, b.leftDisjunct) &&
        propsEqual(a.rightDisjunct, b.rightDisjunct)
      )
  }
}

const matchSchemaFormula = (
  sf: SchemaFormula,
  p: Prop,
  fb: FormulaBinding,
): boolean => {
  switch (sf.kind) {
    case 'var': {
      const bound = fb.get(sf.name)
      if (bound !== undefined) return propsEqual(bound, p)
      fb.set(sf.name, p)
      return true
    }
    case 'atom':
      return p.kind === 'atom' && p.value === sf.value
    case 'falsum':
      return p.kind === 'falsum'
    case 'verum':
      return p.kind === 'verum'
    case 'negation':
      return p.kind === 'negation' && matchSchemaFormula(sf.negand, p.negand, fb)
    case 'implication':
      return (
        p.kind === 'implication' &&
        matchSchemaFormula(sf.antecedent, p.antecedent, fb) &&
        matchSchemaFormula(sf.consequent, p.consequent, fb)
      )
    case 'conjunction':
      return (
        p.kind === 'conjunction' &&
        matchSchemaFormula(sf.leftConjunct, p.leftConjunct, fb) &&
        matchSchemaFormula(sf.rightConjunct, p.rightConjunct, fb)
      )
    case 'disjunction':
      return (
        p.kind === 'disjunction' &&
        matchSchemaFormula(sf.leftDisjunct, p.leftDisjunct, fb) &&
        matchSchemaFormula(sf.rightDisjunct, p.rightDisjunct, fb)
      )
  }
}

// Backtracking match: try to unify a schema context against a concrete prop list.
// The seq-var loop saves/restores both bindings on failure, so inner calls don't need to.
const matchSchemaContext = (
  ctx: SchemaContext,
  ctxIdx: number,
  props: Prop[],
  propIdx: number,
  fb: FormulaBinding,
  sb: SequenceBinding,
): boolean => {
  if (ctxIdx === ctx.length) return propIdx === props.length
  const item = ctx[ctxIdx]!
  if (item.kind !== 'seq') {
    if (propIdx >= props.length) return false
    return (
      matchSchemaFormula(item, props[propIdx]!, fb) &&
      matchSchemaContext(ctx, ctxIdx + 1, props, propIdx + 1, fb, sb)
    )
  }
  const bound = sb.get(item.name)
  if (bound !== undefined) {
    if (propIdx + bound.length > props.length) return false
    for (let i = 0; i < bound.length; i++) {
      if (!propsEqual(bound[i]!, props[propIdx + i]!)) return false
    }
    return matchSchemaContext(ctx, ctxIdx + 1, props, propIdx + bound.length, fb, sb)
  }
  const minForRest = ctx.slice(ctxIdx + 1).filter((i) => i.kind !== 'seq').length
  const maxLen = props.length - propIdx - minForRest
  for (let len = 0; len <= maxLen; len++) {
    const savedFb = new Map(fb)
    const savedSb = new Map(sb)
    sb.set(item.name, props.slice(propIdx, propIdx + len))
    if (matchSchemaContext(ctx, ctxIdx + 1, props, propIdx + len, fb, sb)) return true
    fb.clear()
    for (const [k, v] of savedFb) fb.set(k, v)
    sb.clear()
    for (const [k, v] of savedSb) sb.set(k, v)
  }
  return false
}

const matchSchemaSequent = (
  schema: SchemaSequent,
  concrete: InstantiatedSequent,
  fb: FormulaBinding,
  sb: SequenceBinding,
): boolean =>
  matchSchemaContext(schema.antecedent, 0, concrete.antecedent, 0, fb, sb) &&
  matchSchemaContext(schema.succedent, 0, concrete.succedent, 0, fb, sb)

const canMatchInstance = (schema: RuleSchema, instance: InstantiatedRule): boolean => {
  if (schema.premises.length !== instance.premises.length) return false
  const fb: FormulaBinding = new Map()
  const sb: SequenceBinding = new Map()
  for (let i = 0; i < schema.premises.length; i += 1) {
    if (!matchSchemaSequent(schema.premises[i]!, instance.premises[i]!, fb, sb))
      return false
  }
  return matchSchemaSequent(schema.conclusion, instance.conclusion, fb, sb)
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  schemas: RuleSchema[]
  answerIndex: number
  instance: InstantiatedRule
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
  const instance = instantiate(
    base,
    config.instanceFormulaSize,
    config.instanceSequenceSize,
    config.instanceConnectives,
    config.instanceSymbols,
  )
  const distractors = generateDistractors(base, config, blocks, 3, instance)
  const all = shuffle([base, ...distractors])
  const answerIndex = all.indexOf(base)

  return {
    schemas: all.map((s, i) => ({ ...s, name: `${i + 1}` })),
    answerIndex,
    instance,
  }
}

// ── Instantiation ──────────────────────────────────────────────────────────────

type FormulaBinding = Map<string, Prop>
type SequenceBinding = Map<string, Prop[]>

const makeRandomProp = (formulaSize: number, connectives: string[], symbols: string[]): Prop => {
  const wc = (c: string) => (connectives.includes(c) ? 1 : 0)
  const ws = (s: string) => (symbols.includes(s) ? 1 : 0)
  return randomWeighted(
    bellRandom(0, formulaSize),
    { negation: wc('negation'), implication: wc('implication'), conjunction: wc('conjunction'), disjunction: wc('disjunction') },
    { p: ws('p'), q: ws('q'), r: ws('r'), s: ws('s'), u: ws('u'), v: ws('v'), falsum: wc('falsum'), verum: wc('verum') },
  )()
}

const instantiateFormula = (f: SchemaFormula, fb: FormulaBinding, formulaSize: number, connectives: string[], symbols: string[]): Prop => {
  switch (f.kind) {
    case 'var': {
      let val = fb.get(f.name)
      if (val === undefined) {
        val = makeRandomProp(formulaSize, connectives, symbols)
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
      return { kind: 'negation', negand: instantiateFormula(f.negand, fb, formulaSize, connectives, symbols) }
    case 'implication':
      return {
        kind: 'implication',
        antecedent: instantiateFormula(f.antecedent, fb, formulaSize, connectives, symbols),
        consequent: instantiateFormula(f.consequent, fb, formulaSize, connectives, symbols),
      }
    case 'conjunction':
      return {
        kind: 'conjunction',
        leftConjunct: instantiateFormula(f.leftConjunct, fb, formulaSize, connectives, symbols),
        rightConjunct: instantiateFormula(f.rightConjunct, fb, formulaSize, connectives, symbols),
      }
    case 'disjunction':
      return {
        kind: 'disjunction',
        leftDisjunct: instantiateFormula(f.leftDisjunct, fb, formulaSize, connectives, symbols),
        rightDisjunct: instantiateFormula(f.rightDisjunct, fb, formulaSize, connectives, symbols),
      }
  }
}

const instantiateContext = (
  ctx: SchemaContext,
  fb: FormulaBinding,
  sb: SequenceBinding,
  formulaSize: number,
  sequenceSize: number,
  connectives: string[],
  symbols: string[],
): Prop[] => {
  const result: Prop[] = []
  for (const item of ctx) {
    if (item.kind === 'seq') {
      let val = sb.get(item.name)
      if (val === undefined) {
        val = Array.from({ length: bellRandom(0, sequenceSize) }, () => makeRandomProp(formulaSize, connectives, symbols))
        sb.set(item.name, val)
      }
      result.push(...val)
    } else {
      result.push(instantiateFormula(item, fb, formulaSize, connectives, symbols))
    }
  }
  return result
}

export type InstantiatedSequent = { antecedent: Prop[]; succedent: Prop[] }
export type InstantiatedRule = {
  premises: InstantiatedSequent[]
  conclusion: InstantiatedSequent
}

export const instantiate = (schema: RuleSchema, formulaSize: number = 2, sequenceSize: number = 2, connectives: string[] = [], symbols: string[] = ['p', 'q', 'r', 's', 'u', 'v']): InstantiatedRule => {
  const fb: FormulaBinding = new Map()
  const sb: SequenceBinding = new Map()
  const instantiateSeq = (s: SchemaSequent): InstantiatedSequent => ({
    antecedent: instantiateContext(s.antecedent, fb, sb, formulaSize, sequenceSize, connectives, symbols),
    succedent: instantiateContext(s.succedent, fb, sb, formulaSize, sequenceSize, connectives, symbols),
  })
  return {
    premises: schema.premises.map(instantiateSeq),
    conclusion: instantiateSeq(schema.conclusion),
  }
}
