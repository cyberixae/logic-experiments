import { Event, reverse0, reverse1 } from '../interactive/event'
import { ProofUsing } from '../model/derivation'
import { Prop } from '../model/prop'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { isReverseId0, isReverseId1, ReverseId1 } from '../rules'
import { isNonEmptyArray, last } from '../utils/array'

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

const walk = (node: ProofUsing<AnySequent, RuleId>, out: Event[]): void => {
  const rule = node.rule
  if (isReverseId1(rule)) {
    const aux = extractAuxFormula(rule, node.deps)
    if (aux !== null) out.push(reverse1(rule, aux))
  } else if (isReverseId0(rule)) {
    out.push(reverse0(rule))
  }
  for (const dep of node.deps) walk(dep, out)
}

export const linearize = (proof: ProofUsing<AnySequent, RuleId>): Event[] => {
  const events: Event[] = []
  walk(proof, events)
  return events
}
