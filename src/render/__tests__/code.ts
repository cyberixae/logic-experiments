import { fromDerivation } from '../code'
import { lk } from '../../systems/lk'
import { AnyDerivation } from '../../model/derivation'

const { a, o, z, i } = lk

describe('code module', () => {
  describe('fromDerivation function', () => {
    it('should produce code', () => {
      const derivation: AnyDerivation = z.ir(
        i.i(o.p2.implication(a('q'), o.p2.implication(a('r'), a('q')))),
      )
      const code: string =
        "z.ir(i.i(o.p2.implication(a('q'),o.p2.implication(a('r'),a('q')))))"
      expect(fromDerivation(derivation)).toBe(code)
    })
  })
})
