import { Proof } from './derivation'
import { AnySequent } from './sequent'
import { Rev } from '../systems/lk'

export type Configuration<J extends AnySequent> = {
  goal: J
  rules: Array<Rev>
}
export interface Challenge<J extends AnySequent> extends Configuration<J> {
  solution: Proof<J>
}
