import { Configuration } from '../model/challenge'
import { random } from '../random/challenge'
import { AnySequent } from '../model/sequent'
import { ChallengeMessage, ControlMessage } from './challenge-worker'

const POOL_TARGET = 5
const FALLBACK_SIZE = 5
const FALLBACK_MIN_DIFFICULTY = 0

export class ChallengePool {
  private pool: Array<Configuration<AnySequent>> = []
  private worker: Worker

  constructor() {
    this.worker = new Worker('lk.w.js')
    this.worker.onmessage = (e: MessageEvent<ChallengeMessage>) => {
      this.pool.push(e.data.challenge)
      if (this.pool.length >= POOL_TARGET) {
        this.send({ type: 'pause' })
      }
    }
    this.worker.onerror = (e) => {
      console.error('Challenge worker error:', e.message)
    }
  }

  private send(msg: ControlMessage) {
    this.worker.postMessage(msg)
  }

  take(): Configuration<AnySequent> {
    const challenge = this.pool.shift()
    if (challenge !== undefined) {
      if (this.pool.length < POOL_TARGET) {
        this.send({ type: 'resume' })
      }
      return challenge
    }
    // Pool empty — generate a simpler challenge synchronously as fallback
    const { goal, rules } = random(FALLBACK_SIZE, FALLBACK_MIN_DIFFICULTY)()
    return { goal, rules }
  }

  cleanup() {
    this.worker.terminate()
  }
}
