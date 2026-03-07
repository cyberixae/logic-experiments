import { Proof } from './derivation'
import { AnyJudgement } from './judgement'
import { Rev } from '../systems/lk'

export type Conjecture<J extends AnyJudgement> = {
  goal: J
  rules: Array<Rev>
}
export interface Theorem<J extends AnyJudgement> extends Conjecture<J> {
  solution: Proof<J>
} 


