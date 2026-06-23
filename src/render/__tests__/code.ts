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

    it('cl1', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const pAndQ = conjunction(atom('p'), atom('q'))
      const cl1 = transformation(sequent([pAndQ], [atom('p')]), [leaf], 'cl1')
      expect(fromDerivation(cl1)).toBe("z.cl1(a('q'),i.i(a('p')))")
    })

    it('cl2', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const pAndQ = conjunction(atom('p'), atom('q'))
      const cl2 = transformation(sequent([pAndQ], [atom('p')]), [leaf], 'cl2')
      expect(fromDerivation(cl2)).toBe("z.cl2(a('p'),i.i(a('p')))")
    })

    it('dr1', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const pOrQ = disjunction(atom('p'), atom('q'))
      const dr1 = transformation(sequent([], [pOrQ]), [leaf], 'dr1')
      expect(fromDerivation(dr1)).toBe("z.dr1(a('q'),i.i(a('p')))")
    })

    it('dr2', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const pOrQ = disjunction(atom('p'), atom('q'))
      const dr2 = transformation(sequent([], [pOrQ]), [leaf], 'dr2')
      expect(fromDerivation(dr2)).toBe("z.dr2(a('p'),i.i(a('p')))")
    })

    it('scl', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const scl = transformation(
        sequent([atom('p')], [atom('p')]),
        [leaf],
        'scl',
      )
      expect(fromDerivation(scl)).toBe("z.scl(i.i(a('p')))")
    })

    it('scr', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const scr = transformation(
        sequent([atom('p')], [atom('p')]),
        [leaf],
        'scr',
      )
      expect(fromDerivation(scr)).toBe("z.scr(i.i(a('p')))")
    })

    it('sxl', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const sxl = transformation(
        sequent([atom('p'), atom('q')], [atom('p')]),
        [leaf],
        'sxl',
      )
      expect(fromDerivation(sxl)).toBe("z.sxl(i.i(a('p')))")
    })

    it('sxr', () => {
      const leaf: AnyDerivation = i.i(a('p'))
      const sxr = transformation(
        sequent([atom('p')], [atom('p'), atom('q')]),
        [leaf],
        'sxr',
      )
      expect(fromDerivation(sxr)).toBe("z.sxr(i.i(a('p')))")
    })
  })
})
