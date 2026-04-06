import {
  reverseAxiom0,
  reverseLogic0,
  reverseStructure0,
  reverse0,
  reverse1,
} from '../rules'
import * as prop from '../model/prop'
import * as seq from '../utils/seq'
import { sequence } from '../utils/seq'
import { entries } from '../utils/record'
import {
  Premise,
  premise,
  Transformation,
  AnyNode,
  Derivation,
  ProofUsing,
  proofUsing,
} from '../model/derivation'
import { AnySequent, sequent, equals, isTautology } from '../model/sequent'
import * as array from '../utils/array'
import { includes } from '../utils/array'
import { Option } from '../utils/option'
import { RuleId } from '../model/rule'
import { Configuration } from '../model/challenge'
import { bruteStructure0, seqKey } from './bruteStructure0'
export { bruteStructure0 } from './bruteStructure0'

const hypoWeaken = (d: Premise<AnySequent>): seq.Seq<Premise<AnySequent>> =>
  function* () {
    const farLeft = d.result.antecedent.at(0)
    const farRight = d.result.succedent.at(-1)
    if (farLeft && farRight) {
      yield premise(sequent([farLeft], [farRight]))
    }
    if (farLeft) {
      yield premise(sequent([farLeft], []))
    }
    if (farRight) {
      yield premise(sequent([], [farRight]))
    }
  }
const bruteWeaken0 = <A extends AnySequent, R extends RuleId>(
  d: Premise<A>,
  rules: ReadonlyArray<R>,
  p: ProofUsing<AnySequent, R>,
): seq.Seq<ProofUsing<A, R>> =>
  function* () {
    if (equals(d.result, p.result)) {
      yield proofUsing(d.result, p.deps, p.rule)
      return
    }
    const swl: RuleId = 'swl'
    if (
      includes(rules, swl) &&
      d.result.antecedent.length > p.result.antecedent.length &&
      reverseStructure0[swl].isResultDerivation(d)
    ) {
      const step = reverseStructure0.swl.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteWeaken0(dep, rules, p), (depProof) =>
          proofUsing(step.result, [depProof], swl),
        )()
      }
      return
    }
    const swr: RuleId = 'swr'
    if (
      includes(rules, swr) &&
      d.result.succedent.length > p.result.succedent.length &&
      reverseStructure0[swr].isResultDerivation(d)
    ) {
      const step = reverseStructure0.swr.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteWeaken0(dep, rules, p), (depProof) =>
          proofUsing(step.result, [depProof], swr),
        )()
      }
      return
    }
  }
const bruteAxiom0 = <S extends AnySequent, R extends RuleId>(
  d: Premise<S>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    for (const rule of Object.values(reverseAxiom0)) {
      if (!includes(rules, rule.id)) {
        continue
      }
      const result = rule.tryReverse(d)
      if (!result) {
        continue
      }
      yield* brute0(result, rules, limit)()
    }
  }
const candidateConnectives = (
  rules: ReadonlyArray<RuleId>,
  sequent: AnySequent,
): Set<prop.ConnectiveType> => {
  const kinds = new Set<prop.ConnectiveType>()
  for (const [rId, rule] of entries(reverse0)) {
    if (!includes(rules, rId)) continue
    for (const kind of rule.connectives) kinds.add(kind)
  }
  for (const p of [...sequent.antecedent, ...sequent.succedent])
    for (const kind of prop.connectives(p)) kinds.add(kind)
  return kinds
}

const formulasOfOpCount = (
  opCount: number,
  atoms: ReadonlyArray<string>,
  connectives: ReadonlySet<prop.ConnectiveType>,
): seq.Seq<prop.Prop> =>
  function* () {
    if (opCount === 0) {
      for (const a of atoms) yield prop.atom(a)
      if (connectives.has('falsum')) yield prop.falsum
      if (connectives.has('verum')) yield prop.verum
      return
    }
    if (connectives.has('negation')) {
      for (const p of formulasOfOpCount(opCount - 1, atoms, connectives)()) {
        yield prop.negation(p)
      }
    }
    for (let leftOps = 0; leftOps < opCount; leftOps += 1) {
      const rightOps = opCount - 1 - leftOps
      for (const l of formulasOfOpCount(leftOps, atoms, connectives)()) {
        for (const r of formulasOfOpCount(rightOps, atoms, connectives)()) {
          if (connectives.has('implication')) yield prop.implication(l, r)
          if (connectives.has('conjunction')) yield prop.conjunction(l, r)
          if (connectives.has('disjunction')) yield prop.disjunction(l, r)
        }
      }
    }
  }

const bruteLogic1 = <S extends AnySequent, R extends RuleId>(
  d: Premise<S>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    const applicableRules = entries(reverse1).filter(([rId]) =>
      includes(rules, rId),
    )
    if (applicableRules.length === 0) return
    const atoms = array.uniq([
      ...d.result.antecedent.flatMap(prop.atoms),
      ...d.result.succedent.flatMap(prop.atoms),
    ])
    const connectives = candidateConnectives(rules, d.result)
    for (let opCount = 0; opCount <= limit * 2; opCount += 1) {
      for (const formula of formulasOfOpCount(opCount, atoms, connectives)()) {
        for (const [, rule] of applicableRules) {
          const result = rule.tryReverse(formula)(d)
          if (!result) continue
          yield* brute0(result, rules, limit)()
        }
      }
    }
  }

const bruteLogic0 = <S extends AnySequent, R extends RuleId>(
  d: Premise<S>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    yield* seq.flatMap(hypoWeaken(d), (hypo) =>
      seq.flatMap(bruteAxiom0(hypo, rules, limit), (h) =>
        bruteWeaken0(d, rules, h),
      ),
    )()
    for (const rule of Object.values(reverseLogic0)) {
      if (!includes(rules, rule.id)) {
        continue
      }
      const result = rule.tryReverse(d)
      if (!result) {
        continue
      }
      yield* brute0(result, rules, limit)()
    }
    yield* bruteLogic1(d, rules, limit)()
  }
const hypoStructure = <R extends RuleId>(
  d: Premise<AnySequent>,
  rules: ReadonlyArray<R>,
): seq.Seq<Premise<AnySequent>> =>
  function* () {
    const visited = new Set<string>()
    const queue: Premise<AnySequent>[] = [d]
    while (queue.length > 0) {
      const current = queue.shift()!
      const key = seqKey(current.result)
      if (visited.has(key)) continue
      visited.add(key)
      yield current
      for (const [rId, rule] of entries(reverseStructure0)) {
        const ruleId: RuleId = rId
        if (!includes(rules, ruleId)) continue
        const reversed = rule.tryReverse(current)
        if (!reversed || reversed.kind !== 'transformation') continue
        const [dep] = reversed.deps
        if (!dep || dep.kind !== 'premise') continue
        queue.push(dep)
      }
    }
  }

const brute0Premise = <S extends AnySequent, R extends RuleId>(
  d: Premise<S>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    if (limit < 1) {
      return
    }
    if (!isTautology(d.result)) {
      return
    }
    yield* seq.flatMap(hypoStructure(d, rules), (hypo) =>
      seq.flatMap(bruteLogic0(hypo, rules, limit), (h) =>
        bruteStructure0(d, rules, h),
      ),
    )()
  }
const brute0Transformation = <S extends AnySequent, R extends RuleId>(
  d: Transformation<S, Array<AnyNode>, R>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    const depProofs = sequence(
      d.deps.map((dep) => brute0(dep, rules, limit - 1)),
    )
    yield* seq.map(depProofs, (proofs) =>
      proofUsing(d.result, proofs, d.rule),
    )()
  }

const brute0 = <S extends AnySequent, R extends RuleId>(
  d: Derivation<S>,
  rules: ReadonlyArray<R>,
  limit: number,
): seq.Seq<ProofUsing<S, R>> =>
  function* () {
    switch (d.kind) {
      case 'premise':
        yield* brute0Premise(d, rules, limit)()
        break
      case 'transformation': {
        const rule: RuleId = d.rule
        if (includes(rules, rule)) {
          yield* brute0Transformation({ ...d, rule }, rules, limit)()
        }
        break
      }
    }
  }

const tryAtDepth = <S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
  limit: number,
): ProofUsing<S, R> | undefined => {
  const proofs = seq.head(brute0(premise(c.goal), c.rules, limit))
  return array.isNonEmptyArray(proofs) ? proofs[0] : undefined
}

export const bruteLimit = <S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
  maxLimit: number,
): Option<ProofUsing<S, R>> => {
  for (let limit = 0; limit <= maxLimit; limit += 1) {
    const proof = tryAtDepth(c, limit)
    if (proof) return [proof]
  }
  return []
}

export function* bruteSearch<S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
): Generator<void, [ProofUsing<S, R>, number]> {
  for (let limit = 0; ; limit += 1) {
    const proof = tryAtDepth(c, limit)
    if (proof) return [proof, limit]
    yield
  }
}

export const brute = <S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
): [ProofUsing<S, R>, number] => {
  const gen = bruteSearch(c)
  while (true) {
    const { done, value } = gen.next()
    if (done === true) return value
  }
}
