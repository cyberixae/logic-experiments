import { mod, NonEmptyArray, replaceItem, ensureNonEmpty } from '../array'

describe('mod', () => {
  const arr: NonEmptyArray<string> = ['a', 'b', 'c']

  it('returns element at positive index', () => {
    expect(mod(arr, 0)).toBe('a')
    expect(mod(arr, 1)).toBe('b')
    expect(mod(arr, 2)).toBe('c')
  })

  it('wraps positive index past end', () => {
    expect(mod(arr, 3)).toBe('a')
    expect(mod(arr, 4)).toBe('b')
    expect(mod(arr, 5)).toBe('c')
  })

  it('wraps negative index to end', () => {
    expect(mod(arr, -1)).toBe('c')
    expect(mod(arr, -2)).toBe('b')
    expect(mod(arr, -3)).toBe('a')
  })

  it('wraps large negative index', () => {
    expect(mod(arr, -4)).toBe('c')
    expect(mod(arr, -7)).toBe('c')
  })

  it('works with single-element array', () => {
    const single: NonEmptyArray<string> = ['x']
    expect(mod(single, 0)).toBe('x')
    expect(mod(single, 1)).toBe('x')
    expect(mod(single, -1)).toBe('x')
  })
})

describe('replaceItem', () => {
  it('replaces item at valid index', () => {
    expect(replaceItem(['a', 'b', 'c'], 1, 'x')).toEqual(['a', 'x', 'c'])
  })

  it('returns null for negative index', () => {
    expect(replaceItem(['a', 'b'], -1, 'x')).toBeNull()
  })

  it('returns null for index beyond length', () => {
    expect(replaceItem(['a', 'b'], 5, 'x')).toBeNull()
  })
})

describe('ensureNonEmpty', () => {
  it('returns array unchanged when non-empty', () => {
    const arr: NonEmptyArray<number> = [1, 2, 3]
    expect(ensureNonEmpty(arr, 0)).toBe(arr)
  })

  it('returns fallback array when empty', () => {
    expect(ensureNonEmpty([], 0)).toEqual([0])
  })
})
