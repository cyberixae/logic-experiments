import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'

export type SolveRequest = {
  type: 'solve'
  requestId: number
  goal: AnySequent
  rules: ReadonlyArray<RuleId>
  // Search gives up past this depth and answers with an 'exhausted' message
  // instead of deepening forever.
  maxDepth: number
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

export type ExhaustedMessage = {
  type: 'exhausted'
  requestId: number
}

export type WorkerMessage = ProofMessage | ExhaustedMessage
