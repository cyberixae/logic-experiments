import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'

export type SolveRequest = {
  type: 'solve'
  requestId: number
  goal: AnySequent
  rules: ReadonlyArray<RuleId>
}

export type CancelRequest = {
  type: 'cancel'
  requestId: number
}

export type ControlMessage = SolveRequest | CancelRequest

export type ProofMessage = {
  type: 'proof'
  requestId: number
  proof: ProofUsing<AnySequent, RuleId>
}

export type WorkerMessage = ProofMessage
