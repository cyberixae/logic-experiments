import { Event } from '../interactive/event'
import { AnyWorkspace } from '../interactive/workspace'
import { ProofUsing } from '../model/derivation'
import { RuleId } from '../model/rule'
import { AnySequent, isTautology } from '../model/sequent'
import { isReverseId1 } from '../rules'
import { NpcKnobs } from './knobs'
import { linearize } from './proof-walker'
import { createSolver, SolveHandle } from './solver-runner'

export type NpcDriverOpts = {
  getWorkspace: () => AnyWorkspace
  getChallengeIdx: () => number
  getTotalMoves: () => number
  applyEvent: (ev: Event) => void
  skip: () => void
  knobs: NpcKnobs
  isGameOver: () => boolean
  isPaused?: () => boolean
}

type SearchRef = {
  proof: ProofUsing<AnySequent, RuleId> | null
  exhausted: boolean
}

type State =
  | { kind: 'idle' }
  | { kind: 'observing' }
  | {
      kind: 'planning'
      observedIdx: number
      startedAt: number
      handle: SolveHandle
      searchRef: SearchRef
    }
  // Bounded search came back empty. Sit visibly stuck for a while (the skip
  // "tell" — a stub until idle behaviour lands), then skip.
  | {
      kind: 'givingUp'
      observedIdx: number
      since: number
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
const PAUSE_POLL_MS = 200

export const createNpcDriver = (
  opts: NpcDriverOpts,
): { cleanup: () => void } => {
  let state: State = { kind: 'idle' }
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null
  let cleanedUp = false
  let pausedAt: number | null = null
  const solver = createSolver()

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
    // Brute search can't pick useful auxiliary formulas for reverse1 rules
    // (cut family) — it enumerates candidates blindly, which explodes the
    // search space. Filter them out, like the challenge generator does.
    const rules = ws.availableRules().filter((r) => !isReverseId1(r))
    // Bypassed (chaos) challenges arrive without a precomputed solution and
    // the goal may not even be a tautology — running brute on it would never
    // return and would block the main thread past skipAfterMs. Skip early
    // when the truth-table check rules out a proof.
    if (!isTautology(goal)) {
      startObserving()
      opts.skip()
      return
    }
    const searchRef: SearchRef = { proof: null, exhausted: false }
    const handle = solver.solveChunked(
      { goal, rules },
      (p) => {
        searchRef.proof = p
      },
      {
        maxDepth: opts.knobs.searchDepth,
        onExhausted: () => {
          searchRef.exhausted = true
        },
      },
    )
    state = {
      kind: 'planning',
      observedIdx: idx,
      startedAt: Date.now(),
      handle,
      searchRef,
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

    if (opts.isPaused?.() ?? false) {
      if (pausedAt === null) pausedAt = Date.now()
      schedule(PAUSE_POLL_MS) // keep the loop alive; do nothing while paused
      return
    }
    if (pausedAt !== null) {
      // Shift time-sensitive timestamps forward by the paused duration so the
      // skip/stuck timers don't falsely fire on resume.
      const delta = Date.now() - pausedAt
      pausedAt = null
      if (state.kind === 'planning') {
        state = { ...state, startedAt: state.startedAt + delta }
      } else if (state.kind === 'givingUp') {
        state = { ...state, since: state.since + delta }
      } else if (state.kind === 'executing') {
        state = {
          ...state,
          challengeStartedAt: state.challengeStartedAt + delta,
        }
      }
    }

    const idx = opts.getChallengeIdx()

    if (
      (state.kind === 'planning' ||
        state.kind === 'givingUp' ||
        state.kind === 'executing') &&
      state.observedIdx !== idx
    ) {
      cancelSolverIfPlanning()
      startObserving()
      return
    }

    const linearizeOpts = {
      shuffle: true,
    }

    if (state.kind === 'idle' || state.kind === 'observing') {
      // No foreknowledge: the NPC never reads the precomputed solution and
      // always searches for itself.
      startPlanning(idx)
      return
    }

    if (state.kind === 'planning') {
      const proof = state.searchRef.proof
      if (proof !== null) {
        state.handle.cancel()
        startExecuting(idx, linearize(proof, linearizeOpts), state.startedAt)
        return
      }
      if (state.searchRef.exhausted) {
        state.handle.cancel()
        state = { kind: 'givingUp', observedIdx: idx, since: Date.now() }
        schedule(PLANNING_POLL_MS)
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

    if (state.kind === 'givingUp') {
      if (Date.now() - state.since > opts.knobs.skipStuckMs) {
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
      solver.cleanup()
    },
  }
}
