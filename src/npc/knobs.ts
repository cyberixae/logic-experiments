export type NpcKnobs = {
  baseThinkMs: number
  jitterMs: number
  skipAfterMs: number
  skipStuckMs: number
  inflateProb: number
}

export const defaultNpcKnobs = (): NpcKnobs => ({
  baseThinkMs: 800,
  jitterMs: 400,
  skipAfterMs: 30000,
  skipStuckMs: 8000,
  inflateProb: 0,
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
    inflateProb: pickNumber(params, prefix + 'inflate', defaults.inflateProb),
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
  params.set(prefix + 'inflate', String(knobs.inflateProb))
}
