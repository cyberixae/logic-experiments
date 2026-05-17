import { Configuration } from '../model/challenge'
import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { ControlMessage, WorkerMessage } from './npc-protocol'

export type SolveHandle = { cancel: () => void }

export type Solver = {
  solveChunked: (
    config: Configuration<AnySequent, ReadonlyArray<RuleId>>,
    onProof: (proof: ProofUsing<AnySequent, RuleId>) => void,
  ) => SolveHandle
  cleanup: () => void
}

type PendingRequest = {
  requestId: number
  onProof: (proof: ProofUsing<AnySequent, RuleId>) => void
}

export const createSolver = (): Solver => {
  let worker: Worker | null = null
  let nextRequestId = 0
  let current: PendingRequest | null = null

  const ensureWorker = (): Worker => {
    if (worker !== null) return worker
    const w = new Worker('lk.npc.w.js')
    w.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type !== 'proof') return
      if (current === null || e.data.requestId !== current.requestId) return
      const onProof = current.onProof
      current = null
      onProof(e.data.proof)
    }
    w.onerror = (e) => {
      console.error('NPC worker error:', e.message)
    }
    worker = w
    return w
  }

  const post = (msg: ControlMessage) => {
    ensureWorker().postMessage(msg)
  }

  return {
    solveChunked: (config, onProof) => {
      const requestId = nextRequestId
      nextRequestId += 1
      current = { requestId, onProof }
      post({
        type: 'solve',
        requestId,
        goal: config.goal,
        rules: config.rules,
      })
      return {
        cancel: () => {
          if (current !== null && current.requestId === requestId) {
            current = null
          }
          if (worker !== null) {
            worker.postMessage({
              type: 'cancel',
              requestId,
            } satisfies ControlMessage)
          }
        },
      }
    },
    cleanup: () => {
      current = null
      if (worker !== null) {
        worker.terminate()
        worker = null
      }
    },
  }
}
