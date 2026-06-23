import { isRuleId } from '../rule'

describe('isRuleId', () => {
  it('accepts known rule identifiers', () => {
    expect(isRuleId('i')).toBe(true)
    expect(isRuleId('swl')).toBe(true)
    expect(isRuleId('sRotLB')).toBe(true)
    expect(isRuleId('cut')).toBe(true)
  })

  it('rejects unknown strings', () => {
    expect(isRuleId('nope')).toBe(false)
    expect(isRuleId('')).toBe(false)
    expect(isRuleId('SWL')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isRuleId(42)).toBe(false)
    expect(isRuleId(null)).toBe(false)
    expect(isRuleId(undefined)).toBe(false)
    expect(isRuleId({ i: 'i' })).toBe(false)
  })
})
