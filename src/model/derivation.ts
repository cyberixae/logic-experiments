import {
  isNonEmptyArray,
  NonEmptyArray,
  replaceItem,
  zip,
} from '../utils/array'
import { AnySequent, equals, Formulas, isTautology, Sequent, sequent } from './sequent'
import { Refinement } from '../utils/generic'
import * as seq from '../utils/seq'
import { reverse0, reverseAxiom0, reverseLogic0 } from '../rules'
import { sequence } from '../utils/seq'

export type Rule = string

export interface Premise<J extends AnySequent> {
  kind: 'premise'
  result: J
}
export function premise<J extends AnySequent>(result: J): Premise<J> {
  return {
    kind: 'premise',
    result,
  }
}
export type AnyPremise = Premise<AnySequent>
export const refinePremise =
  <A extends AnySequent, B extends A>(r: Refinement<A, B>) =>
  (s: Premise<A>): s is Premise<B> => {
    return r(s.result)
  }

export interface Transformation<
  J extends AnySequent,
  D extends Array<AnyNode>,
  R extends Rule,
> {
  kind: 'transformation'
  result: J
  rule: R
  deps: D
}
export function transformation<
  J extends AnySequent,
  D extends Array<AnyNode>,
  R extends Rule,
>(result: J, deps: D, rule: R): Transformation<J, D, R> {
  return { kind: 'transformation', result, deps, rule }
}
export type AnyTransformation = Transformation<AnySequent, Array<AnyNode>, Rule>

export type AnyNode = AnyPremise | AnyTransformation

export type Derivation<R extends AnySequent> =
  | Premise<R>
  | Transformation<R, Array<AnyNode>, Rule>
export type AnyDerivation = Derivation<AnySequent>
export const refineDerivation =
  <A extends AnySequent, B extends A>(r: Refinement<A, B>) =>
  (s: Derivation<A>): s is Derivation<B> => {
    return r(s.result)
  }

export type Introduction<J extends AnySequent, R extends Rule> = Transformation<
  J,
  [],
  R
>
export function introduction<J extends AnySequent, R extends Rule>(
  result: J,
  rule: R,
): Introduction<J, R> {
  return transformation(result, [], rule)
}
export type AnyIntroduction = Introduction<AnySequent, Rule>

export type Proof<
  J extends AnySequent,
  D extends Array<AnyProof> = Array<AnyProof>,
  R extends Rule = Rule,
> = Transformation<J, D, R>
export function proof<
  J extends AnySequent,
  D extends Array<AnyProof>,
  R extends Rule,
>(result: J, deps: D, rule: R): Proof<J, D, R> {
  return { kind: 'transformation', result, deps, rule }
}
export type AnyProof = Proof<AnySequent, Array<AnyProof>, Rule>

export const isEquivalent = <J extends AnySequent>(
  a: Derivation<J>,
  b: Derivation<J>,
) => equals(a.result, b.result)

export const replaceDep = <
  P extends Transformation<AnySequent, Array<AnyNode>, Rule>,
  I extends number,
>(
  parent: P,
  index: I,
  d: P['deps'][I],
): P | null => {
  const deps = replaceItem(parent.deps, index, d)
  if (!deps) {
    return null
  }
  if (!zip(parent.deps, deps).every(([a, b]) => isEquivalent(a, b))) {
    return null
  }
  return { ...parent, deps }
}

export type Edit = <J extends AnySequent>(
  d: Derivation<J>,
) => Derivation<J> | null

export type Path = Array<number>

export const editPremise = <J extends AnySequent>(
  root: Premise<J>,
  path: Path,
  edit: Edit,
): Derivation<J> | null => {
  if (isNonEmptyArray(path)) {
    // Premises don't have deps
    return null
  }
  return edit(root)
}

export const editTransformation = <J extends AnySequent>(
  root: Transformation<J, Array<AnyNode>, string>,
  path: Path,
  edit: Edit,
): Derivation<J> | null => {
  if (isNonEmptyArray(path)) {
    const [index, ...rest] = path
    const dep = root.deps[index]
    if (!dep) {
      return null
    }
    const update = editDerivation(dep, rest, edit)
    if (!update) {
      return null
    }
    return replaceDep(root, index, update)
  }
  return edit(root)
}

export const editDerivation = <J extends AnySequent>(
  root: Derivation<J> | null,
  path: Path,
  edit: Edit,
): Derivation<J> | null => {
  if (!root) {
    return null
  }
  switch (root.kind) {
    case 'premise':
      return editPremise(root, path, edit)
    case 'transformation':
      return editTransformation(root, path, edit)
  }
}

const subDerivationPremise = <J extends AnySequent>(
  root: Premise<J>,
  path: Path,
): AnyDerivation | null => {
  if (isNonEmptyArray(path)) {
    // Premises don't have deps
    return null
  }
  return root
}

const subDerivationTransformation = <J extends AnySequent>(
  root: Transformation<J, Array<AnyNode>, string>,
  path: Path,
): AnyDerivation | null => {
  if (isNonEmptyArray(path)) {
    const [index, ...rest] = path
    const dep = root.deps[index]
    if (!dep) {
      return null
    }
    return subDerivation(dep, rest)
  }
  return root
}
export const subDerivation = <J extends AnySequent>(
  root: Derivation<J> | null,
  path: Path,
): AnyDerivation | null => {
  if (!root) {
    return null
  }
  switch (root.kind) {
    case 'premise':
      return subDerivationPremise(root, path)
    case 'transformation':
      return subDerivationTransformation(root, path)
  }
}

const branchesPremise = (_d: AnyPremise, path: Path): NonEmptyArray<Path> => {
  return [path]
}
const branchesTransformation = (
  d: AnyTransformation,
  path: Path,
): NonEmptyArray<Path> => {
  const paths = d.deps.flatMap((dep, i) => branches(dep, [...path, i]))
  if (isNonEmptyArray(paths)) {
    return paths
  }
  return [path]
}
export const branches = (
  root: AnyDerivation,
  path: Path = [],
): NonEmptyArray<Path> => {
  switch (root.kind) {
    case 'premise':
      return branchesPremise(root, path)
    case 'transformation':
      return branchesTransformation(root, path)
  }
}

const openBranchesPremise = (
  _d: AnyPremise,
  path: Path,
): NonEmptyArray<Path> => {
  return [path]
}
const openBranchesTransformation = (
  d: AnyTransformation,
  path: Path,
): Array<Path> => {
  const paths = d.deps.flatMap((dep, i) => openBranches(dep, [...path, i]))
  if (isNonEmptyArray(paths)) {
    return paths
  }
  return []
}
export const openBranches = (
  root: AnyDerivation,
  path: Path = [],
): Array<Path> => {
  switch (root.kind) {
    case 'premise':
      return openBranchesPremise(root, path)
    case 'transformation':
      return openBranchesTransformation(root, path)
  }
}

export const isProof = <J extends AnySequent>(
  d: Derivation<J>,
): d is Proof<J> => {
  return openBranches(d).length < 1
}

export const toProof = <J extends AnySequent>(
  d: Derivation<J>,
): Proof<J> | null => {
  return isProof(d) ? d : null
}

const equalsPremise = (a: AnyPremise, b: AnyPremise): boolean => {
  return isEquivalent(a, b)
}
const equalsTransformation = (
  a: AnyTransformation,
  b: AnyTransformation,
): boolean => {
  return (
    isEquivalent(a, b) &&
    zip(a.deps, b.deps).every(([aDep, bDep]) => equalsDerivation(aDep, bDep))
  )
}
export const equalsDerivation = (
  a: AnyDerivation,
  b: AnyDerivation,
): boolean => {
  switch (a.kind) {
    case 'premise':
      if (b.kind !== 'premise') {
        return false
      }
      return equalsPremise(a, b)
    case 'transformation':
      if (b.kind !== 'transformation') {
        return false
      }
      return equalsTransformation(a, b)
  }
}

const hypoWeaken = (d: Premise<AnySequent>): seq.Seq<Premise<AnySequent>> => function* () {
  const activeLeft = d.result.antecedent.at(-1)
  const activeRight = d.result.succedent.at(0)
  if (activeLeft && activeRight) {
    yield premise(sequent([activeLeft], [activeRight]))
  }
  if (activeLeft) {
    yield premise(sequent([activeLeft], []))
  }
  if (activeRight) {
    yield premise(sequent([], [activeRight]))
  }
}

const bruteWeaken0 = <A extends AnySequent, B extends AnySequent>(d: Premise<A>, p: Proof<B>): seq.Seq<Proof<A>> => function* () {

}

const bruteAxiom0 = <S extends AnySequent>(d: Premise<S>, limit: number): seq.Seq<Proof<S>> => function* () {
  for (const rule of Object.values(reverseAxiom0)) {
    const result = rule.tryReverse(d)
    if (!result) {
      continue
    }
    yield* brute0(result, limit)()
  }
}

const bruteLogic0 = <S extends AnySequent>(d: Premise<S>, limit: number): seq.Seq<Proof<S>> => function* () {
  yield* seq.flatMap(hypoWeaken(d), (hypo) => seq.flatMap(bruteAxiom0(hypo, limit), (h) => bruteWeaken0(d, h)))()
  for (const rule of Object.values(reverseLogic0)) {
    const result = rule.tryReverse(d)
    if (!result) {
      continue
    }
    yield* brute0(result, limit)()
  }
}

const rotate = <T>([x, ...xs]: NonEmptyArray<T>): NonEmptyArray<T> => [...xs, x] as unknown as NonEmptyArray<T>

const rotationsF = (f: Formulas): seq.Seq<Formulas> => function* () {
  yield f
  if (!isNonEmptyArray(f)) {
    return
  }
  let bob = f
  while (bob[0] !== f[0]) {
    bob = rotate(bob)
  }
  yield bob


}

const rotationsS = (s: AnySequent): seq.Seq<AnySequent> => function* () {
  const foo: seq.Seq<[Formulas, Formulas]> = sequence([s.antecedent, s.succedent].map((formulas: Formulas): seq.Seq<Formulas> => rotationsF(formulas))) as seq.Seq<[Formulas, Formulas]>
  const bob = seq.map<[Formulas, Formulas], AnySequent>(foo, ([antecedent, succedent]) => sequent(antecedent, succedent))
  yield* bob()
}

const hypoRotate = (d: Premise<AnySequent>): seq.Seq<Premise<AnySequent>> => function* () {
  yield * seq.map(rotationsS(d.result), premise)()
}


const bruteRotate0 = <A extends AnySequent, B extends AnySequent>(d: Premise<A>, p: Proof<B>): seq.Seq<Proof<A>> => function* () {

}

const brute0Premise = <S extends AnySequent>(d: Premise<S>, limit: number): seq.Seq<Proof<S>> => function* () {
  if (limit < 1) {
    return
  }
  if (!isTautology(d.result)) {
    return
  }
  yield* seq.flatMap(hypoRotate(d), (hypo) => seq.flatMap(bruteLogic0(hypo, limit), (h) => bruteRotate0(d, h)))()
}
const brute0Transformation = <S extends AnySequent>(d: Transformation<S, Array<AnyNode>, Rule>, limit: number): seq.Seq<Proof<S>> => function*()  {
  const depProofs = sequence(d.deps.map((dep) => brute0(dep, limit - 1)))
  yield* seq.map(depProofs, (proofs) => proof(d.result, proofs, d.rule))()
}
export const brute0 = <S extends AnySequent>(d: Derivation<S>, limit: number): seq.Seq<Proof<S>> => function* () {
  switch (d.kind) {
    case 'premise':
      yield* brute0Premise(d, (limit))()
      break
    case 'transformation':
      yield* brute0Transformation(d, (limit))()
      break
  }
}