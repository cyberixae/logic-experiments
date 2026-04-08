import { AnySequent } from '../model/sequent'
import { premise } from '../model/derivation'
import { reverseLogic0, reverseStructure0 } from '../rules'
import { RuleId } from '../model/rule'
import { Gaze } from './workspace'

export type GhostStep = {
  rule: RuleId
  // The sequent that becomes active after this step is committed.
  sequent: AnySequent
}

export type GhostKind = 'connective' | 'weakening'

const MAX_STEPS = 64

const findConnectiveRule = (
  seq: AnySequent,
  side: 'left' | 'right',
  available: ReadonlySet<RuleId>,
): keyof typeof reverseLogic0 | null => {
  const candidates: ReadonlyArray<keyof typeof reverseLogic0> =
    side === 'left'
      ? (['nl', 'cl', 'cl1', 'cl2', 'dl', 'il'] as const)
      : (['nr', 'dr', 'dr1', 'dr2', 'cr', 'ir'] as const)
  for (const id of candidates) {
    if (!available.has(id)) continue
    if (reverseLogic0[id].isResult(seq)) return id
  }
  return null
}

const stepRotation = (
  seq: AnySequent,
  side: 'left' | 'right',
  available: ReadonlySet<RuleId>,
): { id: RuleId; next: AnySequent } | null => {
  const rule =
    side === 'left' ? reverseStructure0.sRotLB : reverseStructure0.sRotRB
  if (!available.has(rule.id)) return null
  const t = rule.tryReverse(premise(seq))
  if (!t || t.kind !== 'transformation') return null
  const dep = t.deps[0]
  if (!dep) return null
  return { id: rule.id, next: dep.result }
}

const stepFinal = (
  seq: AnySequent,
  side: 'left' | 'right',
  kind: GhostKind,
  available: ReadonlySet<RuleId>,
): { id: RuleId; next: AnySequent } | null => {
  if (kind === 'weakening') {
    const rule = side === 'left' ? reverseStructure0.swl : reverseStructure0.swr
    if (!available.has(rule.id)) return null
    const t = rule.tryReverse(premise(seq))
    if (!t || t.kind !== 'transformation') return null
    const dep = t.deps[0]
    if (!dep) return null
    return { id: rule.id, next: dep.result }
  }
  const id = findConnectiveRule(seq, side, available)
  if (!id) return null
  const rule = reverseLogic0[id]
  const t = rule.tryReverse(premise(seq))
  if (!t || t.kind !== 'transformation') return null
  const dep = t.deps[0]
  if (!dep) return null
  return { id, next: dep.result }
}

export const computeGhostChain = (
  current: AnySequent,
  gaze: Gaze,
  kind: GhostKind,
  availableRules: ReadonlyArray<RuleId>,
): GhostStep[] | null => {
  const available = new Set(availableRules)
  const chain: GhostStep[] = []
  let seq = current
  let g = gaze

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const ant = seq.antecedent.length
    const suc = seq.succedent.length
    if (g.side === 'left' && (ant === 0 || g.index === ant - 1)) break
    if (g.side === 'right' && (suc === 0 || g.index === 0)) break

    const step = stepRotation(seq, g.side, available)
    if (!step) return null
    chain.push({ rule: step.id, sequent: step.next })
    seq = step.next
    g =
      g.side === 'left'
        ? { side: 'left', index: g.index + 1 }
        : { side: 'right', index: g.index - 1 }
  }

  const final = stepFinal(seq, g.side, kind, available)
  if (!final) return null
  chain.push({ rule: final.id, sequent: final.next })
  return chain
}

