/// <reference lib="webworker" />

import { Configuration } from '../model/challenge'
import { random } from '../random/challenge'
import { AnySequent } from '../model/sequent'

export type ChallengeMessage = {
  type: 'challenge'
  challenge: Configuration<AnySequent>
}
export type ControlMessage = { type: 'pause' } | { type: 'resume' }

let running = true

const generate = (): Configuration<AnySequent> => {
  const { goal, rules } = random()()
  return { goal, rules }
}

const loop = () => {
  if (!running) return
  const challenge = generate()
  self.postMessage({ type: 'challenge', challenge } satisfies ChallengeMessage)
  setTimeout(loop, 0)
}

self.onmessage = (e: MessageEvent<ControlMessage>) => {
  if (e.data.type === 'pause') {
    running = false
  } else if (e.data.type === 'resume' && !running) {
    running = true
    loop()
  }
}

loop()
