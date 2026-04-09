import { splitAt } from '../number'

describe('splitAt', () => {
  it('splits at zero fraction', () => {
    expect(splitAt(10, 0)).toEqual([0, 10])
  })

  it('splits at full fraction', () => {
    expect(splitAt(10, 1)).toEqual([10, 0])
  })

  it('splits at half', () => {
    expect(splitAt(10, 0.5)).toEqual([5, 5])
  })

  it('floors the left part', () => {
    expect(splitAt(10, 0.33)).toEqual([3, 7])
  })

  it('parts sum to original', () => {
    const [a, b] = splitAt(7, 0.42)
    expect(a + b).toBe(7)
  })

  it('handles zero input', () => {
    expect(splitAt(0, 0.5)).toEqual([0, 0])
  })
})
