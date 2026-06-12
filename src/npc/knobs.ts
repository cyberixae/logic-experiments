// The NPC searches with a depth budget and no foreknowledge of the solution:
// it solves what its own bounded search reaches, and visibly gives up
// (hesitates, then skips) on anything deeper — never falling back to an
// unbounded solver.
export type NpcKnobs = {
  baseThinkMs: number
  jitterMs: number
  skipAfterMs: number
  skipStuckMs: number
  searchDepth: number
}

export const defaultNpcKnobs = (): NpcKnobs => ({
  // Tuned 2026-06-12 so the default opponent is not trivially beatable:
  // depth 8 solves essentially the whole default pool (12/12 sampled,
  // search <160ms), and ~400ms per move finishes a typical 11-19 event
  // plan in 5-8s per level.
  baseThinkMs: 400,
  jitterMs: 250,
  skipAfterMs: 30000,
  skipStuckMs: 8000,
  searchDepth: 8,
})

const pickNumber = (
  params: URLSearchParams,
  key: string,
  fallback: number,
): number => {
  const raw = params.get(key)
  if (raw === null || raw === '') return fallback
  const value = parseFloat(raw)
  return Number.isFinite(value) ? value : fallback
}

export const parseNpcKnobsFromParams = (
  params: URLSearchParams,
  prefix: string,
): NpcKnobs => {
  const defaults = defaultNpcKnobs()
  return {
    baseThinkMs: pickNumber(params, prefix + 'think', defaults.baseThinkMs),
    jitterMs: pickNumber(params, prefix + 'jitter', defaults.jitterMs),
    skipAfterMs: pickNumber(params, prefix + 'skip_time', defaults.skipAfterMs),
    skipStuckMs: pickNumber(
      params,
      prefix + 'skip_stuck',
      defaults.skipStuckMs,
    ),
    searchDepth: pickNumber(params, prefix + 'depth', defaults.searchDepth),
  }
}

export const setNpcKnobsParams = (
  knobs: NpcKnobs,
  params: URLSearchParams,
  prefix: string,
): void => {
  params.set(prefix + 'think', String(knobs.baseThinkMs))
  params.set(prefix + 'jitter', String(knobs.jitterMs))
  params.set(prefix + 'skip_time', String(knobs.skipAfterMs))
  params.set(prefix + 'skip_stuck', String(knobs.skipStuckMs))
  params.set(prefix + 'depth', String(knobs.searchDepth))
}
