import { isNonEmptyArray, NonEmptyArray, replaceItem, zip } from './array'
import { AnyJudgement, equals } from './judgement'
import { Refinement } from './generic'

export type Rule = string

export interface Premise<J extends AnyJudgement> {
  kind: 'premise'
  result: J
}
export function premise<J extends AnyJudgement>(result: J): Premise<J> {
  return {
    kind: 'premise',
    result,
  }
}
export type AnyPremise = Premise<AnyJudgement>
export const refinePremise =
  <A extends AnyJudgement, B extends A>(r: Refinement<A, B>) =>
  (s: Premise<A>): s is Premise<B> => {
    return r(s.result)
  }

export interface Transformation<
  J extends AnyJudgement,
  D extends Array<AnyNode>,
  R extends Rule,
> {
  kind: 'transformation'
  result: J
  rule: R
  deps: D
}
export function transformation<
  J extends AnyJudgement,
  D extends Array<AnyNode>,
  R extends Rule,
>(result: J, deps: D, rule: R): Transformation<J, D, R> {
  return { kind: 'transformation', result, deps, rule }
}
export type AnyTransformation = Transformation<
  AnyJudgement,
  Array<AnyNode>,
  Rule
>

export type AnyNode = AnyPremise | AnyTransformation

export type Derivation<R extends AnyJudgement> =
  | Premise<R>
  | Transformation<R, Array<AnyNode>, Rule>
export type AnyDerivation = Derivation<AnyJudgement>
export const refineDerivation =
  <A extends AnyJudgement, B extends A>(r: Refinement<A, B>) =>
  (s: Derivation<A>): s is Derivation<B> => {
    return r(s.result)
  }

export type Introduction<
  J extends AnyJudgement,
  R extends Rule,
> = Transformation<J, [], R>
export function introduction<J extends AnyJudgement, R extends Rule>(
  result: J,
  rule: R,
): Introduction<J, R> {
  return transformation(result, [], rule)
}
export type AnyIntroduction = Introduction<AnyJudgement, Rule>

export interface Proof<
  J extends AnyJudgement,
  D extends Array<AnyProof> = Array<AnyProof>,
  R extends Rule = Rule,
> extends Transformation<J, D, R> {}
export type AnyProof = Proof<AnyJudgement, Array<AnyProof>, Rule>

export const isProof = <J extends AnyJudgement>(
  d: Derivation<J>,
): d is Proof<J> => {
  return d.kind === 'transformation' && d.deps.every((dep) => isProof(dep))
}

export const toProof = <J extends AnyJudgement>(
  d: Derivation<J>,
): Proof<J> | null => {
  return isProof(d) ? d : null
}

export const isEquivalent = <J extends AnyJudgement>(
  a: Derivation<J>,
  b: Derivation<J>,
) => equals(a.result, b.result)

export const replaceDep = <
  P extends Transformation<AnyJudgement, Array<AnyNode>, Rule>,
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

export type Edit = <J extends AnyJudgement>(
  d: Derivation<J>,
) => Derivation<J> | null

export type Path = Array<number>

export const editPremise = <J extends AnyJudgement>(
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

export const editTransformation = <J extends AnyJudgement>(
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

export const editDerivation = <J extends AnyJudgement>(
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

export const lsPremise = (_d: AnyPremise, path: Path): NonEmptyArray<Path> => {
  return [path]
}
export const lsTransformation = (
  d: AnyTransformation,
  path: Path,
): NonEmptyArray<Path> => {
  const paths = d.deps.flatMap((dep, i) => lsDerivation(dep, [...path, i]))
  if (isNonEmptyArray(paths)) {
    return paths
  }
  return [path]
}
export const lsDerivation = (
  root: AnyDerivation,
  path: Path = [],
): NonEmptyArray<Path> => {
  switch (root.kind) {
    case 'premise':
      return lsPremise(root, path)
    case 'transformation':
      return lsTransformation(root, path)
  }
}
