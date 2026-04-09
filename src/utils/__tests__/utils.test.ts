import { assertEqual, assertNever } from '../utils'

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

  describe('assertNever', () => {
    it('throws with default message', () => {
      expect(() => assertNever(0 as never)).toThrow('Unexpected value')
    })

    it('throws with custom message', () => {
      expect(() => assertNever(0 as never, 'custom')).toThrow('custom')
    })
  })
})
