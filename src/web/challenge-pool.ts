import { random, randomConfiguredStep } from '../random/challenge'
import * as prop from '../model/prop'
import { conclusion } from '../model/sequent'
import { RandomConfig } from '../random/config'
import {
  ChallengeMessage,
  ChallengeResult,
  ControlMessage,
  serializeConfig,
} from './challenge-protocol'

const POOL_TARGET = 5
const FALLBACK_SIZE = 5
const FALLBACK_MIN_DIFFICULTY = 0
const RULES = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
] as const

const generateBypass = (config: RandomConfig): ChallengeResult => {
  const size = Math.floor(Math.random() * config.size) + 1
  const formula = prop.randomWeighted(
    size,
    config.connectives,
    config.symbols,
  )()
  return {
    challenge: { rules: [...RULES], goal: conclusion(formula) },
    nonStructuralCount: 0,
    bypassed: true,
    formulasTried: 1,
  }
}

export class ChallengePool {
  private pool: Array<ChallengeResult> = []
  private worker: Worker
  private currentConfig: RandomConfig | undefined

  constructor() {
    this.worker = new Worker('lk.w.js')
    this.worker.onmessage = (e: MessageEvent<ChallengeMessage>) => {
      if (e.data.type !== 'challenge') return
      const result = e.data.result
      if (
        this.currentConfig &&
        result.nonStructuralCount !== this.currentConfig.targetNonStructural
      ) {
        return
      }
      this.pool.push(result)
      if (this.pool.length >= POOL_TARGET) {
        this.send({ type: 'pause' })
      }
    }
    this.worker.onerror = (e) => {
      console.error('Challenge worker error:', e.message)
    }
    this.send({ type: 'resume' })
  }

  private send(msg: ControlMessage) {
    this.worker.postMessage(msg)
  }

  configure(config: RandomConfig, seed?: Array<ChallengeResult>) {
    this.currentConfig = config
    this.pool = seed ?? []
    this.send({ type: 'pause' })
    this.send({
      type: 'configure',
      config: serializeConfig({ ...config, bypassPercent: 0 }),
    })
    if (this.pool.length < POOL_TARGET) {
      this.send({ type: 'resume' })
    }
  }

  take(): ChallengeResult {
    // Roll bypass on the fly
    if (
      this.currentConfig &&
      Math.random() < this.currentConfig.bypassPercent / 100
    ) {
      return generateBypass(this.currentConfig)
    }

    const result = this.pool.shift()
    if (result !== undefined) {
      if (this.pool.length < POOL_TARGET) {
        this.send({ type: 'resume' })
      }
      return result
    }
    // Pool empty — generate synchronously as fallback
    if (this.currentConfig) {
      const looseConfig = {
        ...this.currentConfig,
        targetNonStructural: Infinity,
        bypassPercent: 0,
      }
      const gen = randomConfiguredStep(looseConfig, () => 1000)
      while (true) {
        const { done, value } = gen.next()
        if (done === true) {
          return {
            challenge: value.challenge,
            nonStructuralCount: value.nonStructuralCount,
            bypassed: false,
            formulasTried: value.formulasTried,
          }
        }
      }
    }
    const challenge = random(FALLBACK_SIZE, FALLBACK_MIN_DIFFICULTY)()
    return {
      challenge,
      nonStructuralCount: 0,
      bypassed: false,
      formulasTried: 0,
    }
  }

  cleanup() {
    this.worker.terminate()
  }
}
