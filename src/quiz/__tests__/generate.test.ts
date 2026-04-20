import { Prop } from '../../model/prop'
import { RuleSchema, SchemaContext, SchemaSequent } from '../schema'
import {
  canMatchInstance,
  InstantiatedRule,
  InstantiatedSequent,
} from '../generate'

// ── Builders ───────────────────────────────────────────────────────────────────

const a = (value: string): Prop => ({ kind: 'atom', value })
const impl = (antecedent: Prop, consequent: Prop): Prop => ({
  kind: 'implication',
  antecedent,
  consequent,
})

const sAtom = (value: string): SchemaContext[number] => ({
  kind: 'atom',
  value,
})
const sVar = (name: string): SchemaContext[number] => ({ kind: 'var', name })
const sSeq = (name: string): SchemaContext[number] => ({ kind: 'seq', name })
const sNeg = (negand: SchemaContext[number]): SchemaContext[number] => {
  if (negand.kind === 'seq') throw new Error('seq in formula position')
  return { kind: 'negation', negand }
}
const sImpl = (
  ant: SchemaContext[number],
  con: SchemaContext[number],
): SchemaContext[number] => {
  if (ant.kind === 'seq' || con.kind === 'seq')
    throw new Error('seq in formula position')
  return { kind: 'implication', antecedent: ant, consequent: con }
}

const seq = (ant: SchemaContext, suc: SchemaContext): SchemaSequent => ({
  antecedent: ant,
  succedent: suc,
})

const schema = (
  premises: SchemaSequent[],
  conclusion: SchemaSequent,
): RuleSchema => ({
  name: '',
  premises,
  conclusion,
})

const inst = (ant: Prop[], suc: Prop[]): InstantiatedSequent => ({
  antecedent: ant,
  succedent: suc,
})

const rule = (
  premises: InstantiatedSequent[],
  conclusion: InstantiatedSequent,
): InstantiatedRule => ({
  premises,
  conclusion,
})

// ── Premise count ──────────────────────────────────────────────────────────────

describe('premise count', () => {
  it('rejects when schema has more premises than instance', () => {
    const s = schema([seq([], [])], seq([], []))
    const i = rule([], inst([], []))
    expect(canMatchInstance(s, i)).toBe(false)
  })

  it('rejects when schema has fewer premises than instance', () => {
    const s = schema([], seq([], []))
    const i = rule([inst([], [])], inst([], []))
    expect(canMatchInstance(s, i)).toBe(false)
  })
})

// ── Atom formulas (no variables) ───────────────────────────────────────────────

describe('atom schema formulas', () => {
  it('matches when atoms align', () => {
    const s = schema([], seq([sAtom('p')], [sAtom('q')]))
    const i = rule([], inst([a('p')], [a('q')]))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('rejects when an atom differs', () => {
    const s = schema([], seq([sAtom('p')], [sAtom('p')]))
    const i = rule([], inst([a('p')], [a('q')]))
    expect(canMatchInstance(s, i)).toBe(false)
  })

  it('rejects when context length differs', () => {
    const s = schema([], seq([sAtom('p'), sAtom('q')], []))
    const i = rule([], inst([a('p')], []))
    expect(canMatchInstance(s, i)).toBe(false)
  })
})

// ── Formula variables ──────────────────────────────────────────────────────────

describe('formula variables', () => {
  it('binds a variable to match a concrete atom', () => {
    const s = schema([], seq([sVar('A')], [sVar('A')]))
    const i = rule([], inst([a('p')], [a('p')]))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('rejects when variable binding is inconsistent', () => {
    // A binds to p in antecedent, but then must match q in succedent
    const s = schema([], seq([sVar('A')], [sVar('A')]))
    const i = rule([], inst([a('p')], [a('q')]))
    expect(canMatchInstance(s, i)).toBe(false)
  })

  it('allows two distinct variables to bind to the same concrete formula', () => {
    const s = schema([], seq([sVar('A')], [sVar('B')]))
    const i = rule([], inst([a('p')], [a('p')]))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('binds a variable to a compound formula', () => {
    const s = schema([], seq([sVar('A')], [sVar('A')]))
    const i = rule([], inst([impl(a('p'), a('q'))], [impl(a('p'), a('q'))]))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('variable schema matches instance even when structures differ at schema level', () => {
    // The distractor schema A → B looks different from atom schema p → q
    // but can still match the same concrete instance via A→p, B→q
    const s = schema([], seq([], [sImpl(sVar('A'), sVar('B'))]))
    const i = rule([], inst([], [impl(a('p'), a('q'))]))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('rejects when connective in schema does not match instance', () => {
    const s = schema([], seq([], [sNeg(sVar('A'))]))
    const i = rule([], inst([], [impl(a('p'), a('q'))]))
    expect(canMatchInstance(s, i)).toBe(false)
  })
})

// ── Sequence variables ─────────────────────────────────────────────────────────

describe('sequence variables', () => {
  it('binds a sequence variable to an empty sequence', () => {
    const s = schema([], seq([sSeq('Γ')], []))
    const i = rule([], inst([], []))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('binds a sequence variable to a single-formula sequence', () => {
    const s = schema([], seq([sSeq('Γ')], []))
    const i = rule([], inst([a('p')], []))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('binds a sequence variable to a multi-formula sequence', () => {
    const s = schema([], seq([sSeq('Γ')], []))
    const i = rule([], inst([a('p'), a('q'), a('r')], []))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('enforces consistent sequence variable binding across premise and conclusion', () => {
    // Γ in premise binds to [p, q]; Γ in conclusion must also be [p, q]
    const s = schema([seq([sSeq('Γ')], [])], seq([sSeq('Γ')], []))
    const matching = rule(
      [inst([a('p'), a('q')], [])],
      inst([a('p'), a('q')], []),
    )
    expect(canMatchInstance(s, matching)).toBe(true)
    const conflicting = rule([inst([a('p'), a('q')], [])], inst([a('r')], []))
    expect(canMatchInstance(s, conflicting)).toBe(false)
  })

  it('matches a formula next to a sequence variable', () => {
    // Schema: Γ, p ⊢   where Γ absorbs everything before the atom p
    const s = schema([], seq([sSeq('Γ'), sAtom('p')], []))
    const i = rule([], inst([a('q'), a('r'), a('p')], []))
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('rejects when the formula beside the sequence variable is absent', () => {
    const s = schema([], seq([sSeq('Γ'), sAtom('p')], []))
    const i = rule([], inst([a('q'), a('r')], []))
    expect(canMatchInstance(s, i)).toBe(false)
  })
})

// ── Multi-premise rules ────────────────────────────────────────────────────────

describe('multi-premise rules', () => {
  it('matches a two-premise rule when both premises align', () => {
    const s = schema(
      [seq([sVar('A')], []), seq([sVar('B')], [])],
      seq([sVar('A'), sVar('B')], []),
    )
    const i = rule(
      [inst([a('p')], []), inst([a('q')], [])],
      inst([a('p'), a('q')], []),
    )
    expect(canMatchInstance(s, i)).toBe(true)
  })

  it('rejects when variable binding conflicts across premises', () => {
    // A binds to p in first premise, must also be p in conclusion — but conclusion has q
    const s = schema([seq([sVar('A')], [])], seq([sVar('A')], []))
    const i = rule([inst([a('p')], [])], inst([a('q')], []))
    expect(canMatchInstance(s, i)).toBe(false)
  })
})
