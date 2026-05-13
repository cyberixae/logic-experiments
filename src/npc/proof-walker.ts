import { Event, nextBranch, reverse0, reverse1 } from '../interactive/event'
import { ProofUsing } from '../model/derivation'
import { Prop } from '../model/prop'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { isReverseId0, isReverseId1, ReverseId1 } from '../rules'
import { isNonEmptyArray, last } from '../utils/array'

export type LinearizeOpts = {
  shuffle?: boolean
  inflateProb?: number
  allowedRules?: ReadonlyArray<RuleId>
}

const extractAuxFormula = (
  rule: ReverseId1,
  deps: ReadonlyArray<ProofUsing<AnySequent, RuleId>>,
): Prop | null => {
  const dep0 = deps[0]
  const dep1 = deps[1]
  if (dep0 === undefined || dep1 === undefined) return null
  if (rule === 'cut' || rule === 'fcut') {
    const succ = dep0.result.succedent
    return isNonEmptyArray(succ) ? last(succ) : null
  }
  // mp: dep1 proves the antecedent P of P → Q
  const succ = dep1.result.succedent
  return isNonEmptyArray(succ) ? succ[0] : null
}

// Insert a cancelling rotation pair when the current sequent and the
// challenge's allowed rules permit it. Adds two transformation nodes to
// the derivation tree (raising countRuleUsage by 2) while leaving the open
// premise's sequent unchanged. Falls through silently when no pair fits.
const tryInflate = (
  sequent: AnySequent,
  allowedRules: ReadonlyArray<RuleId>,
  out: Event[],
): void => {
  if (
    sequent.antecedent.length > 1 &&
    allowedRules.includes('sRotLF') &&
    allowedRules.includes('sRotLB')
  ) {
    out.push(reverse0('sRotLF'))
    out.push(reverse0('sRotLB'))
    return
  }
  if (
    sequent.succedent.length > 1 &&
    allowedRules.includes('sRotRF') &&
    allowedRules.includes('sRotRB')
  ) {
    out.push(reverse0('sRotRF'))
    out.push(reverse0('sRotRB'))
  }
}

const walk = (
  node: ProofUsing<AnySequent, RuleId>,
  out: Event[],
  shuffle: boolean,
  inflateProb: number,
  allowedRules: ReadonlyArray<RuleId>,
): void => {
  if (inflateProb > 0 && Math.random() < inflateProb) {
    tryInflate(node.result, allowedRules, out)
  }

  const rule = node.rule
  if (isReverseId1(rule)) {
    const aux = extractAuxFormula(rule, node.deps)
    if (aux !== null) out.push(reverse1(rule, aux))
  } else if (isReverseId0(rule)) {
    out.push(reverse0(rule))
  }

  // For 2-dep branching rules, randomly visit deps in reverse order.
  // After emitting nextBranch the workspace focuses dep[1]; once that subtree
  // closes, forwardThenBackOpen navigates back to the still-open dep[0].
  if (shuffle && node.deps.length === 2 && Math.random() < 0.5) {
    const dep0 = node.deps[0]
    const dep1 = node.deps[1]
    if (dep0 !== undefined && dep1 !== undefined) {
      out.push(nextBranch())
      walk(dep1, out, shuffle, inflateProb, allowedRules)
      walk(dep0, out, shuffle, inflateProb, allowedRules)
      return
    }
  }
  for (const dep of node.deps) {
    walk(dep, out, shuffle, inflateProb, allowedRules)
  }
}

export const linearize = (
  proof: ProofUsing<AnySequent, RuleId>,
  opts: LinearizeOpts = {},
): Event[] => {
  const events: Event[] = []
  const shuffle = opts.shuffle ?? true
  const inflateProb = opts.inflateProb ?? 0
  const allowedRules = opts.allowedRules ?? []
  walk(proof, events, shuffle, inflateProb, allowedRules)
  return events
}
