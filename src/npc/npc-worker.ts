/// <reference lib="webworker" />

import { bruteSearchLimit } from '../solver/brute'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { ControlMessage, WorkerMessage } from './npc-protocol'

let currentRequestId: number | null = null

const startSolve = (
  requestId: number,
  goal: AnySequent,
  rules: ReadonlyArray<RuleId>,
  maxDepth: number,
) => {
  currentRequestId = requestId
  const gen = bruteSearchLimit({ goal, rules }, maxDepth)
  const tick = () => {
    if (currentRequestId !== requestId) return
    const result = gen.next()
    if (result.done === true) {
      currentRequestId = null
      if (result.value === null) {
        self.postMessage({
          type: 'exhausted',
          requestId,
        } satisfies WorkerMessage)
        return
      }
      const [proof] = result.value
      self.postMessage({
        type: 'proof',
        requestId,
        proof,
      } satisfies WorkerMessage)
      return
    }
    setTimeout(tick, 0)
  }
  setTimeout(tick, 0)
}

self.onmessage = (e: MessageEvent<ControlMessage>) => {
  if (e.data.type === 'solve') {
    startSolve(e.data.requestId, e.data.goal, e.data.rules, e.data.maxDepth)
  } else if (e.data.type === 'cancel') {
    if (currentRequestId === e.data.requestId) {
      currentRequestId = null
    }
  }
}
