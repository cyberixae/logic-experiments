import {
  basic,
  fromProp,
  fromSequent,
  fromRuleId,
  fromPremise,
  fromDerivation,
  type Templates,
} from '../print'
import { plain } from '../segment'
import {
  atom,
  falsum,
  verum,
  negation,
  conjunction,
  disjunction,
  implication,
} from '../../model/prop'
import { sequent } from '../../model/sequent'
import { premise } from '../../model/derivation'
import { conclusion } from '../../model/sequent'
import { rk } from '../../systems/rk'

const { a, z, i } = rk

const custom: Templates = {
  falsum: ['F'],
  verum: ['T'],
  atom: ['[', ']'],
  optional: ['', ''],
  parenthesis: ['{', '}'],
  negation: ['NOT ', ''],
  conjunction: ['', ' AND ', ''],
  disjunction: ['', ' OR ', ''],
  implication: ['', ' IMP ', ''],
  formulas: ['', '; ', ''],
  sequent: ['', ' PROVES ', ''],
}

describe('print module', () => {
  describe('fromProp', () => {
    it('atom with emoji p', () => {
      expect(plain(fromProp(atom('p'))(basic))).toBe('🐧')
    })

    it('atom with emoji q', () => {
      expect(plain(fromProp(atom('q'))(basic))).toBe('🦜')
    })

    it('atom with emoji r', () => {
      expect(plain(fromProp(atom('r'))(basic))).toBe('🦃')
    })

    it('atom with emoji s', () => {
      expect(plain(fromProp(atom('s'))(basic))).toBe('🦆')
    })

    it('atom without emoji', () => {
      expect(plain(fromProp(atom('x'))(basic))).toBe('x')
    })

    it('falsum', () => {
      expect(plain(fromProp(falsum)(basic))).toBe('⊥')
    })

    it('verum', () => {
      expect(plain(fromProp(verum)(basic))).toBe('⊤')
    })

    it('negation of atom', () => {
      expect(plain(fromProp(negation(atom('p')))(basic))).toBe('¬🐧')
    })

    it('negation of negation (no parens)', () => {
      expect(plain(fromProp(negation(negation(atom('p'))))(basic))).toBe('¬¬🐧')
    })

    it('negation of falsum (no parens)', () => {
      expect(plain(fromProp(negation(falsum))(basic))).toBe('¬⊥')
    })

    it('negation of conjunction (parenthesized)', () => {
      expect(
        plain(fromProp(negation(conjunction(atom('p'), atom('q'))))(basic)),
      ).toBe('¬(🐧∧🦜)')
    })

    it('negation of disjunction (parenthesized)', () => {
      expect(
        plain(fromProp(negation(disjunction(atom('p'), atom('q'))))(basic)),
      ).toBe('¬(🐧∨🦜)')
    })

    it('negation of implication (parenthesized)', () => {
      expect(
        plain(fromProp(negation(implication(atom('p'), atom('q'))))(basic)),
      ).toBe('¬(🐧→🦜)')
    })

    it('conjunction of atoms', () => {
      expect(plain(fromProp(conjunction(atom('p'), atom('q')))(basic))).toBe(
        '🐧∧🦜',
      )
    })

    it('conjunction of conjunctions (parenthesized)', () => {
      expect(
        plain(
          fromProp(
            conjunction(
              conjunction(atom('p'), atom('q')),
              conjunction(atom('r'), atom('s')),
            ),
          )(basic),
        ),
      ).toBe('(🐧∧🦜)∧(🦃∧🦆)')
    })

    it('conjunction of negation (no parens)', () => {
      expect(
        plain(fromProp(conjunction(negation(atom('p')), atom('q')))(basic)),
      ).toBe('¬🐧∧🦜')
    })

    it('conjunction of disjunction (parenthesized)', () => {
      expect(
        plain(
          fromProp(conjunction(disjunction(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('(🐧∨🦜)∧🦃')
    })

    it('conjunction of implication (parenthesized)', () => {
      expect(
        plain(
          fromProp(conjunction(implication(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('(🐧→🦜)∧🦃')
    })

    it('disjunction of atoms', () => {
      expect(plain(fromProp(disjunction(atom('p'), atom('q')))(basic))).toBe(
        '🐧∨🦜',
      )
    })

    it('disjunction of disjunctions (parenthesized)', () => {
      expect(
        plain(
          fromProp(
            disjunction(
              disjunction(atom('p'), atom('q')),
              disjunction(atom('r'), atom('s')),
            ),
          )(basic),
        ),
      ).toBe('(🐧∨🦜)∨(🦃∨🦆)')
    })

    it('disjunction of conjunction (parenthesized)', () => {
      expect(
        plain(
          fromProp(disjunction(conjunction(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('(🐧∧🦜)∨🦃')
    })

    it('disjunction of implication (parenthesized)', () => {
      expect(
        plain(
          fromProp(disjunction(implication(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('(🐧→🦜)∨🦃')
    })

    it('implication of atoms', () => {
      expect(plain(fromProp(implication(atom('p'), atom('q')))(basic))).toBe(
        '🐧→🦜',
      )
    })

    it('implication antecedent is implication (parenthesized)', () => {
      expect(
        plain(
          fromProp(implication(implication(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('(🐧→🦜)→🦃')
    })

    it('implication consequent is implication (parenthesized)', () => {
      expect(
        plain(
          fromProp(implication(atom('p'), implication(atom('q'), atom('r'))))(
            basic,
          ),
        ),
      ).toBe('🐧→(🦜→🦃)')
    })

    it('implication of conjunction (no parens)', () => {
      expect(
        plain(
          fromProp(implication(conjunction(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('🐧∧🦜→🦃')
    })

    it('implication of disjunction (no parens)', () => {
      expect(
        plain(
          fromProp(implication(disjunction(atom('p'), atom('q')), atom('r')))(
            basic,
          ),
        ),
      ).toBe('🐧∨🦜→🦃')
    })
  })

  describe('fromSequent', () => {
    it('empty antecedent and succedent', () => {
      expect(plain(fromSequent(sequent([], []))(basic))).toBe('⊢')
    })

    it('single formula on each side', () => {
      expect(plain(fromSequent(sequent([atom('p')], [atom('q')]))(basic))).toBe(
        '🐧 ⊢ 🦜',
      )
    })

    it('empty antecedent', () => {
      expect(plain(fromSequent(sequent([], [atom('p')]))(basic))).toBe('⊢ 🐧')
    })

    it('empty succedent', () => {
      expect(plain(fromSequent(sequent([atom('p')], []))(basic))).toBe('🐧 ⊢')
    })

    it('multiple formulas', () => {
      expect(
        plain(
          fromSequent(sequent([atom('p'), atom('q')], [atom('r'), atom('s')]))(
            basic,
          ),
        ),
      ).toBe('🐧,🦜 ⊢ 🦃,🦆')
    })
  })

  describe('fromRuleId', () => {
    it('i', () => {
      expect(plain(fromRuleId('i')(basic))).toBe('I')
    })

    it('f', () => {
      expect(plain(fromRuleId('f')(basic))).toBe('⊥')
    })

    it('v', () => {
      expect(plain(fromRuleId('v')(basic))).toBe('⊤')
    })

    it('il', () => {
      expect(plain(fromRuleId('il')(basic))).toBe('→L')
    })

    it('ir', () => {
      expect(plain(fromRuleId('ir')(basic))).toBe('→R')
    })

    it('cl', () => {
      expect(plain(fromRuleId('cl')(basic))).toBe('∧L')
    })

    it('cr', () => {
      expect(plain(fromRuleId('cr')(basic))).toBe('∧R')
    })

    it('dl', () => {
      expect(plain(fromRuleId('dl')(basic))).toBe('∨L')
    })

    it('dr', () => {
      expect(plain(fromRuleId('dr')(basic))).toBe('∨R')
    })

    it('nl', () => {
      expect(plain(fromRuleId('nl')(basic))).toBe('¬L')
    })

    it('nr', () => {
      expect(plain(fromRuleId('nr')(basic))).toBe('¬R')
    })

    it('swl', () => {
      expect(plain(fromRuleId('swl')(basic))).toBe('WL')
    })

    it('swr', () => {
      expect(plain(fromRuleId('swr')(basic))).toBe('WR')
    })

    it('cl1', () => {
      expect(plain(fromRuleId('cl1')(basic))).toBe('∧L\u2081')
    })

    it('cl2', () => {
      expect(plain(fromRuleId('cl2')(basic))).toBe('∧L\u2082')
    })

    it('dr1', () => {
      expect(plain(fromRuleId('dr1')(basic))).toBe('∨R\u2081')
    })

    it('dr2', () => {
      expect(plain(fromRuleId('dr2')(basic))).toBe('∨R\u2082')
    })

    it('scl', () => {
      expect(plain(fromRuleId('scl')(basic))).toBe('CL')
    })

    it('scr', () => {
      expect(plain(fromRuleId('scr')(basic))).toBe('CR')
    })

    it('sxl', () => {
      expect(plain(fromRuleId('sxl')(basic))).toBe('XL')
    })

    it('sxr', () => {
      expect(plain(fromRuleId('sxr')(basic))).toBe('XR')
    })

    it('sRotLF', () => {
      expect(plain(fromRuleId('sRotLF')(basic))).toBe('\u21B6L')
    })

    it('sRotRF', () => {
      expect(plain(fromRuleId('sRotRF')(basic))).toBe('\u21b7R')
    })

    it('sRotLB', () => {
      expect(plain(fromRuleId('sRotLB')(basic))).toBe('\u21b7L')
    })

    it('sRotRB', () => {
      expect(plain(fromRuleId('sRotRB')(basic))).toBe('\u21B6R')
    })

    it('a1', () => {
      expect(plain(fromRuleId('a1')(basic))).toBe('a1')
    })

    it('a2', () => {
      expect(plain(fromRuleId('a2')(basic))).toBe('a2')
    })

    it('a3', () => {
      expect(plain(fromRuleId('a3')(basic))).toBe('a3')
    })

    it('cut', () => {
      expect(plain(fromRuleId('cut')(basic))).toBe('✂️')
    })

    it('mp', () => {
      expect(plain(fromRuleId('mp')(basic))).toBe('mp')
    })
  })

  describe('custom theme', () => {
    it('falsum', () => {
      expect(plain(fromProp(falsum)(custom))).toBe('F')
    })

    it('verum', () => {
      expect(plain(fromProp(verum)(custom))).toBe('T')
    })

    it('atom wrapped', () => {
      expect(plain(fromProp(atom('x'))(custom))).toBe('[x]')
    })

    it('negation', () => {
      expect(plain(fromProp(negation(atom('x')))(custom))).toBe('NOT [x]')
    })

    it('conjunction', () => {
      expect(plain(fromProp(conjunction(atom('x'), atom('y')))(custom))).toBe(
        '[x] AND [y]',
      )
    })

    it('parenthesis template used for nested conjunction', () => {
      expect(
        plain(fromProp(negation(conjunction(atom('x'), atom('y'))))(custom)),
      ).toBe('NOT {[x] AND [y]}')
    })

    it('implication', () => {
      expect(plain(fromProp(implication(atom('x'), atom('y')))(custom))).toBe(
        '[x] IMP [y]',
      )
    })

    it('sequent separator', () => {
      expect(
        plain(fromSequent(sequent([atom('x')], [atom('y')]))(custom)),
      ).toBe('[x] PROVES [y]')
    })

    it('formulas separator', () => {
      expect(
        plain(
          fromSequent(sequent([atom('x'), atom('y')], [atom('z')]))(custom),
        ),
      ).toBe('[x]; [y] PROVES [z]')
    })

    it('implication rule label uses theme', () => {
      expect(plain(fromRuleId('il')(custom))).toBe(' IMP L')
    })

    it('conjunction rule label uses theme', () => {
      expect(plain(fromRuleId('cl')(custom))).toBe(' AND L')
    })

    it('disjunction rule label uses theme', () => {
      expect(plain(fromRuleId('dr')(custom))).toBe(' OR R')
    })

    it('negation rule label uses theme', () => {
      expect(plain(fromRuleId('nl')(custom))).toBe('NOT L')
    })
  })

  describe('fromPremise', () => {
    it('renders the sequent as string', () => {
      expect(fromPremise(premise(conclusion(atom('p'))))).toBe('⊢ 🐧')
    })
  })

  describe('active connective', () => {
    const activeText = (segments: ReturnType<ReturnType<typeof fromProp>>) =>
      segments.filter((s) => s.active).map((s) => s.text)

    it('no active segments by default', () => {
      expect(
        activeText(fromProp(conjunction(atom('p'), atom('q')))(basic)),
      ).toEqual([])
    })

    it('negation marks ¬', () => {
      expect(activeText(fromProp(negation(atom('p')), true)(basic))).toEqual([
        '¬',
      ])
    })

    it('conjunction marks ∧', () => {
      expect(
        activeText(fromProp(conjunction(atom('p'), atom('q')), true)(basic)),
      ).toEqual(['∧'])
    })

    it('disjunction marks ∨', () => {
      expect(
        activeText(fromProp(disjunction(atom('p'), atom('q')), true)(basic)),
      ).toEqual(['∨'])
    })

    it('implication marks →', () => {
      expect(
        activeText(fromProp(implication(atom('p'), atom('q')), true)(basic)),
      ).toEqual(['→'])
    })

    it('only outermost connective is marked', () => {
      expect(
        activeText(
          fromProp(conjunction(negation(atom('p')), atom('q')), true)(basic),
        ),
      ).toEqual(['∧'])
    })

    it('fromSequent marks outermost connective on left', () => {
      const seq = sequent([conjunction(atom('p'), atom('q'))], [])
      expect(activeText(fromSequent(seq)(basic))).toEqual(['∧'])
    })

    it('fromSequent marks outermost connective on right', () => {
      const seq = sequent([], [implication(atom('p'), atom('q'))])
      expect(activeText(fromSequent(seq)(basic))).toEqual(['→'])
    })

    it('fromSequent marks every outermost connective', () => {
      const seq = sequent(
        [conjunction(atom('p'), atom('q')), disjunction(atom('r'), atom('s'))],
        [implication(atom('p'), atom('q'))],
      )
      expect(activeText(fromSequent(seq)(basic))).toEqual(['∧', '∨', '→'])
    })

    it('fromSequent no active for atoms', () => {
      const seq = sequent([atom('p')], [atom('q')])
      expect(activeText(fromSequent(seq)(basic))).toEqual([])
    })
  })

  describe('fromDerivation', () => {
    it('premise', () => {
      expect(fromDerivation(premise(conclusion(atom('p'))))).toBe('⊢ 🐧')
    })

    it('transformation', () => {
      const derivation = z.ir(i.i(a('p')))
      expect(fromDerivation(derivation)).toBe(
        '              \n――――――――― (I) \n 🐧 ⊢ 🐧      \n――――――――― (→R)\n ⊢ 🐧→🐧      ',
      )
    })
  })
})
