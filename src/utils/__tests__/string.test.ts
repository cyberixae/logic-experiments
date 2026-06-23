import { split } from '../string'

describe('split', () => {
  it('splits on the separator', () => {
    expect(split('a b c', ' ')).toEqual(['a', 'b', 'c'])
  })

  it('returns a single-element array when the separator is absent', () => {
    expect(split('abc', ',')).toEqual(['abc'])
  })

  it('keeps empty segments between consecutive separators', () => {
    expect(split('a,,b', ',')).toEqual(['a', '', 'b'])
  })

  it('returns a single empty string for empty input', () => {
    expect(split('', ' ')).toEqual([''])
  })
})
