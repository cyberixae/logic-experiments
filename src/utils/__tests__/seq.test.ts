import {
  empty,
  of,
  map,
  flatMap,
  filter,
  isEmpty,
  fromNullable,
  sequence,
  head,
  sequenceT,
  repeatIO,
} from '../seq'

const collect = <T>(s: () => Generator<T, void, undefined>): T[] => [...s()]

describe('seq', () => {
  describe('empty', () => {
    it('yields nothing', () => {
      expect(collect(empty())).toEqual([])
    })
  })

  describe('of', () => {
    it('yields a single value', () => {
      expect(collect(of(42))).toEqual([42])
    })
  })

  describe('map', () => {
    it('transforms values', () => {
      const s = of(3)
      expect(collect(map(s, (x) => x * 2))).toEqual([6])
    })

    it('maps empty to empty', () => {
      expect(collect(map(empty(), (x) => x))).toEqual([])
    })
  })

  describe('flatMap', () => {
    it('chains sequences', () => {
      const s = of(2)
      const result = flatMap(s, (x) => of(x + 1))
      expect(collect(result)).toEqual([3])
    })

    it('flatMaps empty to empty', () => {
      const result = flatMap(empty<number>(), (x) => of(x))
      expect(collect(result)).toEqual([])
    })
  })

  describe('filter', () => {
    it('keeps matching values', () => {
      const s = sequence([of(1), of(2), of(3)])
      const result = filter(
        map(s, (arr) => arr.reduce((a, b) => a + b, 0)),
        (x) => x > 4,
      )
      expect(collect(result)).toEqual([6])
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty', () => {
      expect(isEmpty(empty())).toBe(true)
    })

    it('returns false for non-empty', () => {
      expect(isEmpty(of(1))).toBe(false)
    })
  })

  describe('fromNullable', () => {
    it('yields value when not null', () => {
      expect(collect(fromNullable(42))).toEqual([42])
    })

    it('yields nothing for null', () => {
      expect(collect(fromNullable(null))).toEqual([])
    })

    it('yields nothing for undefined', () => {
      expect(collect(fromNullable(undefined))).toEqual([])
    })
  })

  describe('sequence', () => {
    it('yields empty array for empty input', () => {
      expect(collect(sequence([]))).toEqual([[]])
    })

    it('yields cartesian product', () => {
      const a = sequence([of(1), of(2)])
      expect(collect(a)).toEqual([[1, 2]])
    })
  })

  describe('head', () => {
    it('returns first value wrapped in array', () => {
      expect(head(of(42))).toEqual([42])
    })

    it('returns empty array for empty seq', () => {
      expect(head(empty())).toEqual([])
    })
  })

  describe('sequenceT', () => {
    it('sequences a tuple of seqs', () => {
      const result = collect(sequenceT([of(1), of('a')]))
      expect(result).toEqual([[1, 'a']])
    })
  })

  describe('repeatIO', () => {
    it('yields values from io repeatedly', () => {
      let n = 0
      const s = repeatIO(() => {
        n += 1
        return n
      })
      const g = s()
      expect(g.next().value).toBe(1)
      expect(g.next().value).toBe(2)
      expect(g.next().value).toBe(3)
    })
  })
})
