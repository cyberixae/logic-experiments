import { Event } from '../interactive/event'
import { AnyWorkspace } from '../interactive/workspace'
import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { NpcKnobs } from './knobs'
import { linearize } from './proof-walker'
import { solveChunked, SolveHandle } from './solver-runner'

export type NpcDriverOpts = {
  getWorkspace: () => AnyWorkspace
  getChallengeIdx: () => number
  getChallengeSolution: () => ProofUsing<AnySequent, RuleId> | undefined
  getTotalMoves: () => number
  applyEvent: (ev: Event) => void
  skip: () => void
  knobs: NpcKnobs
  isGameOver: () => boolean
}

type ProofRef = { value: ProofUsing<AnySequent, RuleId> | null }

type State =
  | { kind: 'idle' }
  | { kind: 'observing' }
  | {
      kind: 'planning'
      observedIdx: number
      startedAt: number
      handle: SolveHandle
      proofRef: ProofRef
    }
  | {
      kind: 'executing'
      observedIdx: number
      plan: Event[]
      cursor: number
      challengeStartedAt: number
      stuckAccumMs: number
    }

const PLANNING_POLL_MS = 300

export const createNpcDriver = (
  opts: NpcDriverOpts,
): { cleanup: () => void } => {
  let state: State = { kind: 'idle' }
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null
  let cleanedUp = false

  const nextThinkDelay = (): number => {
    const base = opts.knobs.baseThinkMs
    const jit = opts.knobs.jitterMs
    if (jit <= 0) return Math.max(50, base)
    const offset = (Math.random() * 2 - 1) * jit
    return Math.max(50, base + offset)
  }

  const schedule = (delayMs: number): void => {
    if (cleanedUp) return
    if (pendingTimeout !== null) clearTimeout(pendingTimeout)
    pendingTimeout = setTimeout(tick, delayMs)
  }

  const cancelSolverIfPlanning = (): void => {
    if (state.kind === 'planning') state.handle.cancel()
  }

  const startObserving = (): void => {
    state = { kind: 'observing' }
    schedule(50)
  }

  const startPlanning = (idx: number): void => {
    const ws = opts.getWorkspace()
    const goal = ws.currentConjecture().derivation.result
    const rules = ws.availableRules()
    const proofRef: ProofRef = { value: null }
    const handle = solveChunked({ goal, rules }, (p) => {
      proofRef.value = p
    })
    state = {
      kind: 'planning',
      observedIdx: idx,
      startedAt: Date.now(),
      handle,
      proofRef,
    }
    schedule(PLANNING_POLL_MS)
  }

  const startExecuting = (
    idx: number,
    plan: Event[],
    challengeStartedAt: number,
  ): void => {
    state = {
      kind: 'executing',
      observedIdx: idx,
      plan,
      cursor: 0,
      challengeStartedAt,
      stuckAccumMs: 0,
    }
    schedule(nextThinkDelay())
  }

  const tick = (): void => {
    pendingTimeout = null
    if (cleanedUp || opts.isGameOver()) return

    const idx = opts.getChallengeIdx()

    if (
      (state.kind === 'planning' || state.kind === 'executing') &&
      state.observedIdx !== idx
    ) {
      cancelSolverIfPlanning()
      startObserving()
      return
    }

    if (state.kind === 'idle' || state.kind === 'observing') {
      const solution = opts.getChallengeSolution()
      if (solution !== undefined) {
        startExecuting(idx, linearize(solution), Date.now())
      } else {
        startPlanning(idx)
      }
      return
    }

    if (state.kind === 'planning') {
      const proof = state.proofRef.value
      if (proof !== null) {
        state.handle.cancel()
        startExecuting(idx, linearize(proof), state.startedAt)
        return
      }
      if (Date.now() - state.startedAt > opts.knobs.skipAfterMs) {
        state.handle.cancel()
        startObserving()
        opts.skip()
        return
      }
      schedule(PLANNING_POLL_MS)
      return
    }

    // state.kind === 'executing'
    if (Date.now() - state.challengeStartedAt > opts.knobs.skipAfterMs) {
      startObserving()
      opts.skip()
      return
    }
    if (state.cursor >= state.plan.length) {
      startObserving()
      opts.skip()
      return
    }
    const ev = state.plan[state.cursor]
    if (ev === undefined) {
      startObserving()
      opts.skip()
      return
    }
    const before = opts.getTotalMoves()
    opts.applyEvent(ev)
    const after = opts.getTotalMoves()

    // applyEvent may have advanced the challenge (if it triggered solve).
    // The next tick will detect the idx change and re-observe.
    if (opts.getChallengeIdx() !== state.observedIdx) {
      startObserving()
      return
    }

    const advanced = after !== before
    const nextStuck = advanced ? 0 : state.stuckAccumMs + opts.knobs.baseThinkMs
    if (nextStuck > opts.knobs.skipStuckMs) {
      startObserving()
      opts.skip()
      return
    }
    state = {
      ...state,
      cursor: state.cursor + 1,
      stuckAccumMs: nextStuck,
    }
    schedule(nextThinkDelay())
  }

  schedule(opts.knobs.baseThinkMs)

  return {
    cleanup: () => {
      cleanedUp = true
      if (pendingTimeout !== null) {
        clearTimeout(pendingTimeout)
        pendingTimeout = null
      }
      cancelSolverIfPlanning()
    },
  }
}
