import { fromDerivation, fromProp } from '../code'
import { rk } from '../../systems/rk'
import { AnyDerivation, premise, transformation } from '../../model/derivation'
import {
  atom,
  falsum,
  verum,
  negation,
  conjunction,
  disjunction,
} from '../../model/prop'
import { conclusion, sequent } from '../../model/sequent'
import { challenges } from '../../challenges'

const { a, o, z, i } = rk

describe('render code module', () => {
  describe('fromProp', () => {
    it('atom', () => {
      expect(fromProp(atom('p'))).toBe("a('p')")
    })

    it('falsum', () => {
      expect(fromProp(falsum)).toBe('o.p0.falsum')
    })

    it('verum', () => {
      expect(fromProp(verum)).toBe('o.p0.verum')
    })

    it('negation', () => {
      expect(fromProp(negation(atom('p')))).toBe("o.p1.negation(a('p'))")
    })

    it('conjunction', () => {
      expect(fromProp(conjunction(atom('p'), atom('q')))).toBe(
        "o.p2.conjunction(a('p'),a('q'))",
      )
    })

    it('disjunction', () => {
      expect(fromProp(disjunction(atom('p'), atom('q')))).toBe(
        "o.p2.disjunction(a('p'),a('q'))",
      )
    })

    it('implication', () => {
      expect(fromProp(o.p2.implication(a('p'), a('q')))).toBe(
        "o.p2.implication(a('p'),a('q'))",
      )
    })
  })

  describe('fromDerivation', () => {
    it('throws for premise', () => {
      expect(() => fromDerivation(premise(conclusion(atom('p'))))).toThrow()
    })

    it('ir', () => {
      const derivation: AnyDerivation = z.ir(
        i.i(o.p2.implication(a('q'), o.p2.implication(a('r'), a('q')))),
      )
      expect(fromDerivation(derivation)).toBe(
        "z.ir(i.i(o.p2.implication(a('q'),o.p2.implication(a('r'),a('q')))))",
      )
    })

    it('all lk challenge solutions are serializable', () => {
      for (const [, { solution }] of Object.entries(challenges)) {
        expect(() => fromDerivation(solution)).not.toThrow()
      }
    })

    it('cut', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const cut = transformation(
        sequent([atom('p')], [atom('q')]),
        [leaf, leaf],
        'cut',
      )
      expect(fromDerivation(cut)).toBe("z.cut(i.i(a('p')),i.i(a('p')))")
    })
  })
})
