import { isNonEmptyArray, NonEmptyArray, replaceItem, zip } from './array'
import { AnyJudgement, equals } from './judgement'

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

export const isProof = <J extends AnyJudgement>(d: Derivation<J>): d is Proof<J> => {
  return d.kind === 'transformation' && d.deps.every((dep) => isProof(dep))
}

export const toProof = <J extends AnyJudgement>(d: Derivation<J>): Proof<J> | null => {
    return isProof(d) ? d : null
}

export const isEquivalent = <J extends AnyJudgement>(a: Derivation<J>, b: Derivation<J>) => equals(a.result, b.result)

export const replaceDep = <P extends Transformation<AnyJudgement, Array<AnyNode>, Rule>, I extends number>(parent: P, index: I, d: P['deps'][I]): P | null => {
  const deps = replaceItem(parent.deps, index, d)
  if (!deps) {
    return null
  }
  if(!zip(parent.deps, deps).every(([a, b]) => isEquivalent(a, b))) {
    return null
  }
  return ({ ...parent, deps })
}

export const replaceBranch = <J extends AnyJudgement>(root: Derivation<J>, path: NonEmptyArray<number>, d: AnyDerivation): Derivation<J> | null => {
   if (root.kind === 'premise') {
     return null
   }
   const [index, ...rest] = path
   if (isNonEmptyArray(rest)) {
     const dep = root.deps[index]
     if (!dep) {
       return null
     }
     const tmp = replaceBranch(dep, rest, d)
     if (!tmp) {
       return null
     }
     return replaceDep(root, index, tmp)
   } else {
     return replaceDep(root, index, d)
   }
}