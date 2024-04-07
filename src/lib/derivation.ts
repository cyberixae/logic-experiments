import { AnyJudgement } from './judgement'

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

/*
export interface Proof<
  J extends AnyJudgement,
  D extends Array<AnyProof> = Array<AnyProof>,
  R extends Rule = Rule,
> extends Transformation<J, D, R> {}
export type AnyProof = Proof<AnyJudgement, Array<AnyProof>, Rule>
*/
