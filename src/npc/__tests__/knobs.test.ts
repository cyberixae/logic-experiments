import {
  defaultNpcKnobs,
  parseNpcKnobsFromParams,
  setNpcKnobsParams,
} from '../knobs'

describe('defaultNpcKnobs', () => {
  it('returns a fresh object each call', () => {
    const a = defaultNpcKnobs()
    const b = defaultNpcKnobs()
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })
})

describe('parseNpcKnobsFromParams', () => {
  it('falls back to defaults when no params are present', () => {
    const params = new URLSearchParams()
    expect(parseNpcKnobsFromParams(params, 'npc1_')).toEqual(defaultNpcKnobs())
  })

  it('reads all knobs from the given prefix', () => {
    const params = new URLSearchParams({
      npc1_think: '100',
      npc1_jitter: '50',
      npc1_skip_time: '5000',
      npc1_skip_stuck: '1500',
    })
    expect(parseNpcKnobsFromParams(params, 'npc1_')).toEqual({
      baseThinkMs: 100,
      jitterMs: 50,
      skipAfterMs: 5000,
      skipStuckMs: 1500,
    })
  })

  it('isolates knobs by prefix', () => {
    const params = new URLSearchParams({
      npc1_think: '111',
      npc2_think: '222',
    })
    expect(parseNpcKnobsFromParams(params, 'npc1_').baseThinkMs).toBe(111)
    expect(parseNpcKnobsFromParams(params, 'npc2_').baseThinkMs).toBe(222)
  })

  it('falls back when a value is empty', () => {
    const params = new URLSearchParams({ npc1_think: '' })
    expect(parseNpcKnobsFromParams(params, 'npc1_').baseThinkMs).toBe(
      defaultNpcKnobs().baseThinkMs,
    )
  })

  it('falls back when a value is not finite', () => {
    const params = new URLSearchParams({
      npc1_think: 'banana',
      npc1_jitter: 'NaN',
    })
    const knobs = parseNpcKnobsFromParams(params, 'npc1_')
    const defaults = defaultNpcKnobs()
    expect(knobs.baseThinkMs).toBe(defaults.baseThinkMs)
    expect(knobs.jitterMs).toBe(defaults.jitterMs)
  })

  it('accepts zero as a valid value (not a falsy fallback)', () => {
    const params = new URLSearchParams({
      npc1_think: '0',
      npc1_jitter: '0',
    })
    const knobs = parseNpcKnobsFromParams(params, 'npc1_')
    expect(knobs.baseThinkMs).toBe(0)
    expect(knobs.jitterMs).toBe(0)
  })
})

describe('setNpcKnobsParams', () => {
  it('writes all knobs under the given prefix', () => {
    const params = new URLSearchParams()
    setNpcKnobsParams(
      {
        baseThinkMs: 100,
        jitterMs: 50,
        skipAfterMs: 5000,
        skipStuckMs: 1500,
      },
      params,
      'npc1_',
    )
    expect(params.get('npc1_think')).toBe('100')
    expect(params.get('npc1_jitter')).toBe('50')
    expect(params.get('npc1_skip_time')).toBe('5000')
    expect(params.get('npc1_skip_stuck')).toBe('1500')
  })

  it('round-trips through parseNpcKnobsFromParams', () => {
    const original = {
      baseThinkMs: 1234,
      jitterMs: 567,
      skipAfterMs: 89000,
      skipStuckMs: 4321,
    }
    const params = new URLSearchParams()
    setNpcKnobsParams(original, params, 'npc2_')
    expect(parseNpcKnobsFromParams(params, 'npc2_')).toEqual(original)
  })
})
