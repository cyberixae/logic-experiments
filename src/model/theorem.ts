import { Proof } from './derivation'
import { AnyJudgement } from './judgement'
import { Rev } from '../systems/lk'

export type Configuration<J extends AnyJudgement> = {
  goal: J
  rules: Array<Rev>
}
export interface Challenge<J extends AnyJudgement> extends Configuration<J> {
  solution: Proof<J>
}
