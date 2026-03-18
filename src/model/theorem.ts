import { Proof } from './derivation'
import { AnySequent } from './sequent'
import { RuleId } from '../systems/lk'

export type Configuration<J extends AnySequent> = {
  goal: J
  rules: Array<RuleId>
}
export interface Challenge<J extends AnySequent> extends Configuration<J> {
  solution: Proof<J>
}
