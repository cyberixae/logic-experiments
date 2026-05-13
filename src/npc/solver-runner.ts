import { bruteSearch } from '../solver/brute'
import { Configuration } from '../model/challenge'
import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'

export type SolveHandle = { cancel: () => void }

type IdleScheduler = (cb: () => void) => void

const scheduleIdle: IdleScheduler = (cb) => {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => cb())
  } else {
    setTimeout(cb, 50)
  }
}

export const solveChunked = (
  config: Configuration<AnySequent, ReadonlyArray<RuleId>>,
  onProof: (proof: ProofUsing<AnySequent, RuleId>) => void,
): SolveHandle => {
  let cancelled = false
  const gen = bruteSearch(config)
  const step = () => {
    if (cancelled) return
    const result = gen.next()
    if (result.done === true) {
      const [proof] = result.value
      onProof(proof)
      return
    }
    scheduleIdle(step)
  }
  scheduleIdle(step)
  return {
    cancel: () => {
      cancelled = true
    },
  }
}
