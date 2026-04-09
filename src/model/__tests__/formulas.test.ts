import { equals, rotations } from '../formulas'
import { atom, negation } from '../prop'

const p = atom('p')
const q = atom('q')
const r = atom('r')

describe('formulas', () => {
  describe('equals', () => {
    it('empty arrays are equal', () => {
      expect(equals([], [])).toBe(true)
    })

    it('same formulas in same order are equal', () => {
      expect(equals([p, q], [p, q])).toBe(true)
    })

    it('different order is not equal', () => {
      expect(equals([p, q], [q, p])).toBe(false)
    })

    it('different lengths are not equal', () => {
      expect(equals([p], [p, q])).toBe(false)
      expect(equals([p, q], [p])).toBe(false)
    })

    it('structurally equal formulas are equal', () => {
      expect(equals([negation(p)], [negation(p)])).toBe(true)
    })

    it('structurally different formulas are not equal', () => {
      expect(equals([negation(p)], [negation(q)])).toBe(false)
    })
  })

  describe('rotations', () => {
    it('empty array yields one rotation (itself)', () => {
      const rots = [...rotations([])()]
      expect(rots).toEqual([[]])
    })

    it('single element yields one rotation', () => {
      const rots = [...rotations([p])()]
      expect(rots).toEqual([[p]])
    })

    it('two elements yield two rotations', () => {
      const rots = [...rotations([p, q])()]
      expect(rots).toEqual([
        [p, q],
        [q, p],
      ])
    })

    it('three elements yield three rotations', () => {
      const rots = [...rotations([p, q, r])()]
      expect(rots).toEqual([
        [p, q, r],
        [q, r, p],
        [r, p, q],
      ])
    })
  })
})
