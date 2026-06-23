import { randomConfigured } from '../challenge'
import { defaultRandomConfig } from '../config'
import { isConclusion } from '../../model/sequent'

describe('randomConfigured', () => {
  it('returns a bypassed challenge immediately when bypassPercent is 100', () => {
    const config = { ...defaultRandomConfig(), bypassPercent: 100 }
    const generate = randomConfigured(config)
    const result = generate()
    expect(result.bypassed).toBe(true)
    expect(result.solved).toBe(0)
    expect(result.nonStructuralCount).toBe(0)
    expect(result.formulasTried).toBe(1)
  })

  it('yields a challenge whose goal is the conclusion of a generated formula', () => {
    const config = { ...defaultRandomConfig(), bypassPercent: 100 }
    const result = randomConfigured(config)()
    expect(isConclusion(result.challenge.goal)).toBe(true)
    expect(result.challenge.rules.length).toBeGreaterThan(0)
  })
})
