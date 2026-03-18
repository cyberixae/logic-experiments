import { Proof } from './derivation'
import { RuleId } from './rule'
import { AnySequent } from './sequent'

export type Configuration<J extends AnySequent> = {
  goal: J
  rules: Array<RuleId>
}
export interface Challenge<J extends AnySequent> extends Configuration<J> {
  solution: Proof<J>
}
