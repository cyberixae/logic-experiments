import { reverseStructure0, reverseAxiom0, reverseLogic0 } from '../rules'
import * as seq from '../utils/seq'
import { sequence } from '../utils/seq'
import {
  Premise,
  premise,
  Proof,
  proof,
  Transformation,
  AnyNode,
  Derivation,
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
import { RuleId } from '../model/rule'

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
const bruteWeaken0 = <A extends AnySequent, B extends AnySequent>(
  d: Premise<A>,
  p: Proof<B>,
): seq.Seq<Proof<A>> =>
  function* () {
    if (equals(d.result, p.result)) {
      yield proof(d.result, p.deps, p.rule)
      return
    }
    if (
      d.result.antecedent.length > p.result.antecedent.length &&
      reverseStructure0.swl.isResultDerivation(d)
    ) {
      const step = reverseStructure0.swl.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteWeaken0(dep, p), (depProof) =>
          proof(step.result, [depProof], step.rule),
        )()
      }
      return
    }
    if (
      d.result.succedent.length > p.result.succedent.length &&
      reverseStructure0.swr.isResultDerivation(d)
    ) {
      const step = reverseStructure0.swr.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteWeaken0(dep, p), (depProof) =>
          proof(step.result, [depProof], step.rule),
        )()
      }
      return
    }
  }
const bruteAxiom0 = <S extends AnySequent>(
  d: Premise<S>,
  limit: number,
): seq.Seq<Proof<S>> =>
  function* () {
    for (const rule of Object.values(reverseAxiom0)) {
      const result = rule.tryReverse(d)
      if (!result) {
        continue
      }
      yield* brute0(result, limit)()
    }
  }
const bruteLogic0 = <S extends AnySequent>(
  d: Premise<S>,
  limit: number,
): seq.Seq<Proof<S>> =>
  function* () {
    yield* seq.flatMap(hypoWeaken(d), (hypo) =>
      seq.flatMap(bruteAxiom0(hypo, limit), (h) => bruteWeaken0(d, h)),
    )()
    for (const rule of Object.values(reverseLogic0)) {
      const result = rule.tryReverse(d)
      if (!result) {
        continue
      }
      yield* brute0(result, limit)()
    }
  }
const hypoRotate = (d: Premise<AnySequent>): seq.Seq<Premise<AnySequent>> =>
  function* () {
    yield* seq.map(rotations(d.result), premise)()
  }
const bruteRotate0 = <A extends AnySequent, B extends AnySequent>(
  d: Premise<A>,
  p: Proof<B>,
): seq.Seq<Proof<A>> =>
  function* () {
    if (equals(d.result, p.result)) {
      yield proof(d.result, p.deps, p.rule)
      return
    }
    if (
      !equalsFormulas(d.result.antecedent, p.result.antecedent) &&
      reverseStructure0.sRotLF.isResultDerivation(d)
    ) {
      const step = reverseStructure0.sRotLF.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteRotate0(dep, p), (depProof) =>
          proof(step.result, [depProof], step.rule),
        )()
      }
      return
    }
    if (
      !equalsFormulas(d.result.succedent, p.result.succedent) &&
      reverseStructure0.sRotRF.isResultDerivation(d)
    ) {
      const step = reverseStructure0.sRotRF.reverse(d)
      const [dep] = step.deps
      if (dep.kind === 'premise') {
        yield* seq.map(bruteRotate0(dep, p), (depProof) =>
          proof(step.result, [depProof], step.rule),
        )()
      }
      return
    }
  }
const brute0Premise = <S extends AnySequent>(
  d: Premise<S>,
  limit: number,
): seq.Seq<Proof<S>> =>
  function* () {
    if (limit < 1) {
      return
    }
    if (!isTautology(d.result)) {
      return
    }
    yield* seq.flatMap(hypoRotate(d), (hypo) =>
      seq.flatMap(bruteLogic0(hypo, limit), (h) => bruteRotate0(d, h)),
    )()
  }
const brute0Transformation = <S extends AnySequent>(
  d: Transformation<S, Array<AnyNode>, RuleId>,
  limit: number,
): seq.Seq<Proof<S>> =>
  function* () {
    const depProofs = sequence(d.deps.map((dep) => brute0(dep, limit - 1)))
    yield* seq.map(depProofs, (proofs) => proof(d.result, proofs, d.rule))()
  }

const brute0 = <S extends AnySequent>(
  d: Derivation<S>,
  limit: number,
): seq.Seq<Proof<S>> =>
  function* () {
    switch (d.kind) {
      case 'premise':
        yield* brute0Premise(d, limit)()
        break
      case 'transformation':
        yield* brute0Transformation(d, limit)()
        break
    }
  }

export const brute = <S extends AnySequent>(s: S): [Proof<S>, number] => {
  let limit = 0
  while (true) {
    const proofs = seq.head(brute0(premise(s), limit))
    if (array.isNonEmptyArray(proofs)) {
      return [proofs[0], limit]
    }
    limit += 1
  }
}
