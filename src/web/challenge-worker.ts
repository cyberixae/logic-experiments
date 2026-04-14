/// <reference lib="webworker" />

import {
  random,
  randomConfiguredStep,
  countNonStructural,
} from '../random/challenge'
import { RandomConfig } from '../random/config'
import {
  ChallengeMessage,
  ChallengeResult,
  ControlMessage,
  deserializeConfig,
} from './challenge-protocol'

let running = false
let loopGeneration = 0
let currentConfig: RandomConfig | undefined
let currentTimeout = 5000

const STATS_INTERVAL = 200
let lastStatsTime = 0
let reportedFormulas = 0
let reportedTautologies = 0
let reportedSolved = 0

const reportStats = (
  formulasTried: number,
  tautologiesFound: number,
  solved: number,
) => {
  const now = Date.now()
  const newFormulas = formulasTried - reportedFormulas
  if (now - lastStatsTime >= STATS_INTERVAL && newFormulas > 0) {
    self.postMessage({
      type: 'stats',
      formulasTried: newFormulas,
      tautologiesFound: tautologiesFound - reportedTautologies,
      solved: solved - reportedSolved,
    } satisfies ChallengeMessage)
    reportedFormulas = formulasTried
    reportedTautologies = tautologiesFound
    reportedSolved = solved
    lastStatsTime = now
  }
}

const loopConfigured = (config: RandomConfig, generation: number) => {
  const gen = randomConfiguredStep(config, () => currentTimeout)
  const tick = () => {
    if (!running || generation !== loopGeneration) return
    const { done, value } = gen.next()
    if (done === true) {
      const result: ChallengeResult = {
        challenge: value.challenge,
        nonStructuralCount: value.nonStructuralCount,
        bypassed: value.bypassed,
        formulasTried: value.formulasTried,
      }
      // Flush remaining stats
      const unreportedFormulas = value.formulasTried - reportedFormulas
      const unreportedTautologies = value.tautologiesFound - reportedTautologies
      const unreportedSolved = value.solved - reportedSolved
      if (unreportedFormulas > 0) {
        self.postMessage({
          type: 'stats',
          formulasTried: unreportedFormulas,
          tautologiesFound: unreportedTautologies,
          solved: unreportedSolved,
        } satisfies ChallengeMessage)
      }
      reportedFormulas = 0
      reportedTautologies = 0
      reportedSolved = 0
      lastStatsTime = Date.now()
      self.postMessage({
        type: 'challenge',
        result,
      } satisfies ChallengeMessage)
      // Start a new generator for the next challenge
      loopConfigured(config, generation)
    } else {
      reportStats(value.formulasTried, value.tautologiesFound, value.solved)
      setTimeout(tick, 0)
    }
  }
  setTimeout(tick, 0)
}

const loopDefault = (generation: number) => {
  if (!running || generation !== loopGeneration) return
  const challenge = random()()
  const result: ChallengeResult = {
    challenge,
    nonStructuralCount: countNonStructural(challenge.solution),
    bypassed: false,
    formulasTried: 0,
  }
  self.postMessage({ type: 'challenge', result } satisfies ChallengeMessage)
  setTimeout(() => loopDefault(generation), 0)
}

const startLoop = () => {
  loopGeneration += 1
  reportedFormulas = 0
  reportedTautologies = 0
  reportedSolved = 0
  lastStatsTime = Date.now()
  const gen = loopGeneration
  if (currentConfig) {
    loopConfigured(currentConfig, gen)
  } else {
    loopDefault(gen)
  }
}

self.onmessage = (e: MessageEvent<ControlMessage>) => {
  if (e.data.type === 'pause') {
    running = false
  } else if (e.data.type === 'resume') {
    if (!running) {
      running = true
      startLoop()
    }
  } else if (e.data.type === 'configure') {
    currentConfig = deserializeConfig(e.data.config)
    if (running) {
      startLoop()
    }
  } else if (e.data.type === 'timeout') {
    currentTimeout = e.data.ms
  }
}
