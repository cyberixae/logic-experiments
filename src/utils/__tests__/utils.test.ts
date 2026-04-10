import { assertEqual, assertNever, isNonNullable } from '../utils'

describe('utils', () => {
  describe('assertEqual', () => {
    it('returns the value when equal', () => {
      expect(assertEqual(1, 1)).toBe(1)
    })

    it('returns the value for structurally equal objects', () => {
      const result = assertEqual({ a: 1 }, { a: 1 })
      expect(result).toEqual({ a: 1 })
    })

    it('throws when not equal', () => {
      expect(() => assertEqual(1, 2 as never)).toThrow()
    })
  })

  describe('isNonNullable', () => {
    it('returns true for a number', () => {
      expect(isNonNullable(1)).toBe(true)
    })

    it('returns true for zero', () => {
      expect(isNonNullable(0)).toBe(true)
    })

    it('returns true for empty string', () => {
      expect(isNonNullable('')).toBe(true)
    })

    it('returns true for false', () => {
      expect(isNonNullable(false)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isNonNullable(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isNonNullable(undefined)).toBe(false)
    })

    it('filters nulls from an array', () => {
      const arr: Array<number | null> = [1, null, 2, null, 3]
      const result: Array<number> = arr.filter(isNonNullable)
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('assertNever', () => {
    it('throws with default message', () => {
      expect(() => assertNever(0 as never)).toThrow('Unexpected value')
    })

    it('throws with custom message', () => {
      expect(() => assertNever(0 as never, 'custom')).toThrow('custom')
    })
  })
})
