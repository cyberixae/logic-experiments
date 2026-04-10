import { reverseStructure0 } from '../rules'
import * as seq from '../utils/seq'
import { entries } from '../utils/record'
import { Premise, ProofUsing, proofUsing } from '../model/derivation'
import { AnySequent, equals } from '../model/sequent'
import { includes } from '../utils/array'
import { RuleId } from '../model/rule'

export const seqKey = (s: AnySequent): string =>
  JSON.stringify([s.antecedent, s.succedent])

// Finds a path from d.result to p.result via structural rule reverses using BFS,
// then reconstructs the proof tree from p upward through the path.
const buildStructurePath = <R extends RuleId>(
  d: Premise<AnySequent>,
  rules: ReadonlyArray<R>,
  p: ProofUsing<AnySequent, R>,
): ProofUsing<AnySequent, R> | null => {
  if (equals(d.result, p.result)) {
    return proofUsing(d.result, p.deps, p.rule)
  }
  const target = seqKey(p.result)
  // BFS: map from seqKey → {parent seqKey, rule used from parent to this node}
  const parent = new Map<string, { parentKey: string; ruleId: R }>()
  const startKey = seqKey(d.result)
  const queue: Premise<AnySequent>[] = [d]
  const visited = new Set<string>([startKey])
  // Map from key → the premise node, for path reconstruction
  const nodes = new Map<string, Premise<AnySequent>>([[startKey, d]])
  let found = false
  outer: while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const currentKey = seqKey(current.result)
    for (const [rId, rule] of entries(reverseStructure0)) {
      const ruleId: RuleId = rId
      if (!includes(rules, ruleId)) continue
      const reversed = rule.tryReverse(current)
      if (!reversed || reversed.kind !== 'transformation') continue
      const [dep] = reversed.deps
      if (!dep || dep.kind !== 'premise') continue
      const depKey = seqKey(dep.result)
      if (visited.has(depKey)) continue
      visited.add(depKey)
      nodes.set(depKey, dep)
      parent.set(depKey, { parentKey: currentKey, ruleId })
      if (depKey === target) {
        found = true
        break outer
      }
      queue.push(dep)
    }
  }
  if (!found) return null
  // Reconstruct proof from target back to start
  let proof: ProofUsing<AnySequent, R> = proofUsing(p.result, p.deps, p.rule)
  let key = target
  while (key !== startKey) {
    const edge = parent.get(key)
    if (!edge) break
    const parentNode = nodes.get(edge.parentKey)
    if (!parentNode) break
    proof = proofUsing(parentNode.result, [proof], edge.ruleId)
    key = edge.parentKey
  }
  return proof
}

// Structural wrapper: connects d to a core proof p using available structural
// rules (rotation, exchange, weakening), without consuming logical depth.
export const bruteStructure0 = <A extends AnySequent, R extends RuleId>(
  d: Premise<A>,
  rules: ReadonlyArray<R>,
  p: ProofUsing<AnySequent, R>,
): seq.Seq<ProofUsing<A, R>> =>
  function* () {
    const result = buildStructurePath(d, rules, p)
    if (result !== null) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      yield result as unknown as ProofUsing<A, R>
    }
  }
