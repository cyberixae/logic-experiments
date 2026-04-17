import { ProofUsing } from './derivation'
import { RuleId } from './rule'
import { AnySequent } from './sequent'

export type Configuration<
  J extends AnySequent,
  S extends ReadonlyArray<RuleId> = ReadonlyArray<RuleId>,
> = {
  goal: J
  rules: S
}
export const configuration = <
  J extends AnySequent,
  const S extends ReadonlyArray<RuleId>,
>(
  c: Configuration<J, S>,
) => c

export interface Challenge<
  J extends AnySequent,
  S extends ReadonlyArray<RuleId>,
> extends Configuration<J, S> {
  solution: ProofUsing<NoInfer<J>, S[number]>
}
export type AnyChallenge = Challenge<AnySequent, ReadonlyArray<RuleId>>
export const isChallenge = (c: Configuration<AnySequent>): c is AnyChallenge =>
  'solution' in c
export const challenge = <
  J extends AnySequent,
  const S extends ReadonlyArray<RuleId>,
>(
  c: Challenge<J, S>,
) => c

export interface Tutorial<
  J extends AnySequent,
  S extends ReadonlyArray<RuleId>,
> extends Challenge<J, S> {
  pinned: ReadonlyArray<S[number]>
}
export type AnyTutorial = Tutorial<AnySequent, ReadonlyArray<RuleId>>
export const isTutorial = (c: Configuration<AnySequent>): c is AnyTutorial =>
  'pinned' in c && Array.isArray(c.pinned)
export const tutorial = <
  J extends AnySequent,
  const S extends ReadonlyArray<RuleId>,
>(
  t: Tutorial<J, S>,
) => t
