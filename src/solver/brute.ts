import { reverseStructure0, reverseAxiom0, reverseLogic0 } from '../rules'
import * as seq from '../utils/seq'
import { sequence } from '../utils/seq'
import {
  Premise,
  premise,
  Transformation,
  AnyNode,
  Derivation,
  ProofUsing,
  proofUsing,
} from '../model/derivation'
import { equals as equalsFormulas } from '../model/formulas'
import {
  AnySequent,
  sequent,
  equals,
  rotations,
  isTautology,
} from '../model/sequent'
import * as array from '../utils/array'
import { includes } from '../utils/array'
import { RuleId } from '../model/rule'
import { Configuration } from '../model/challenge'

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
  }
const hypoRotate = (d: Premise<AnySequent>): seq.Seq<Premise<AnySequent>> =>
  function* () {
    yield* seq.map(rotations(d.result), premise)()
  }
const bruteRotate0 = <A extends AnySequent, R extends RuleId>(
  d: Premise<A>,
  rules: ReadonlyArray<R>,
  p: ProofUsing<AnySequent, R>,
): seq.Seq<ProofUsing<A, R>> =>
  function* () {
    if (equals(d.result, p.result)) {
      yield proofUsing(d.result, p.deps, p.rule)
      return
    }
    const sRotLF: RuleId = 'sRotLF'
    if (
      includes(rules, sRotLF) &&
      !equalsFormulas(d.result.antecedent, p.result.antecedent) &&
      reverseStructure0[sRotLF].isResultDerivation(d)
    ) {
      const step = reverseStructure0.sRotLF.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteRotate0(dep, rules, p), (depProof) =>
          proofUsing(step.result, [depProof], sRotLF),
        )()
      }
      return
    }
    const sRotRF: RuleId = 'sRotRF'
    if (
      includes(rules, sRotRF) &&
      !equalsFormulas(d.result.succedent, p.result.succedent) &&
      reverseStructure0[sRotRF].isResultDerivation(d)
    ) {
      const step = reverseStructure0.sRotRF.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteRotate0(dep, rules, p), (depProof) =>
          proofUsing(step.result, [depProof], sRotRF),
        )()
      }
      return
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
    yield* seq.flatMap(hypoRotate(d), (hypo) =>
      seq.flatMap(bruteLogic0(hypo, rules, limit), (h) =>
        bruteRotate0(d, rules, h),
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

export const brute = <S extends AnySequent, R extends RuleId>(
  c: Configuration<S, ReadonlyArray<R>>,
): [ProofUsing<S, R>, number] => {
  let limit = 0
  while (true) {
    const proofs = seq.head(brute0(premise(c.goal), c.rules, limit))
    if (array.isNonEmptyArray(proofs)) {
      return [proofs[0], limit]
    }
    limit += 1
  }
}
