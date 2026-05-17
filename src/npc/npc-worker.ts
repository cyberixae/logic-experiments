/// <reference lib="webworker" />

import { bruteSearch } from '../solver/brute'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { ControlMessage, WorkerMessage } from './npc-protocol'

let currentRequestId: number | null = null

const startSolve = (
  requestId: number,
  goal: AnySequent,
  rules: ReadonlyArray<RuleId>,
) => {
  currentRequestId = requestId
  const gen = bruteSearch({ goal, rules })
  const tick = () => {
    if (currentRequestId !== requestId) return
    const result = gen.next()
    if (result.done === true) {
      const [proof] = result.value
      currentRequestId = null
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
    startSolve(e.data.requestId, e.data.goal, e.data.rules)
  } else if (e.data.type === 'cancel') {
    if (currentRequestId === e.data.requestId) {
      currentRequestId = null
    }
  }
}
