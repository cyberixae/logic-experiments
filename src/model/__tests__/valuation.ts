import { fromSeq } from '../../utils/array'
import { valuations } from '../valuation'

describe('valuation module', () => {
  describe('valuations function', () => {
    it('works with empty array', () => {
      expect(fromSeq(valuations(['p']))).toStrictEqual([
        { p: true },
        { p: false },
      ])
      expect(fromSeq(valuations(['p', 'q']))).toStrictEqual([
        { p: true, q: true },
        { p: true, q: false },
        { p: false, q: true },
        { p: false, q: false },
      ])
    })
  })
})
