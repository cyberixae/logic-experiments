import { AnySequent } from '../model/sequent'
import { premise } from '../model/derivation'
import { reverseLogic0, reverseStructure0 } from '../rules'
import { RuleId } from '../model/rule'
import { Gaze } from './workspace'

export type GhostStep = {
  rule: RuleId
  // Sequents produced by this step. A single entry for linear rules; the
  // final step may contain multiple entries when the rule branches
  // (e.g. cr, dl, il).
  sequents: AnySequent[]
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
      ? (['nl', 'cl', 'cl1', 'cl2', 'dl', 'il', 'tc', 'td'] as const)
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
    side === 'left'
      ? available.has('sRotLB')
        ? reverseStructure0.sRotLB
        : available.has('tsrotb')
          ? reverseStructure0.tsrotb
          : null
      : available.has('sRotRB')
        ? reverseStructure0.sRotRB
        : null
  if (!rule) return null
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
): { id: RuleId; nexts: AnySequent[] } | null => {
  if (kind === 'weakening') {
    const leftCandidates: ReadonlyArray<keyof typeof reverseStructure0> = [
      'swl',
      'tsw',
      'tswba',
      'tswa',
      'tswp',
      'tswq',
      'tswpp',
      'tswpq',
      'tswqp',
      'tswqq',
    ]
    const candidates =
      side === 'left' ? leftCandidates : (['swr'] as const)
    for (const id of candidates) {
      const rule = reverseStructure0[id]
      if (!rule || !available.has(rule.id)) continue
      const t = rule.tryReverse(premise(seq))
      if (!t || t.kind !== 'transformation') continue
      const nexts = t.deps.map((d) => d.result)
      if (nexts.length === 0) continue
      return { id: rule.id, nexts }
    }
    return null
  }
  const id = findConnectiveRule(seq, side, available)
  if (!id) return null
  const rule = reverseLogic0[id]
  const t = rule.tryReverse(premise(seq))
  if (!t || t.kind !== 'transformation') return null
  const nexts = t.deps.map((d) => d.result)
  if (nexts.length === 0) return null
  return { id, nexts }
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
    chain.push({ rule: step.id, sequents: [step.next] })
    seq = step.next
    g =
      g.side === 'left'
        ? { side: 'left', index: g.index + 1 }
        : { side: 'right', index: g.index - 1 }
  }

  const final = stepFinal(seq, g.side, kind, available)
  if (!final) return null
  chain.push({ rule: final.id, sequents: final.nexts })
  return chain
}
