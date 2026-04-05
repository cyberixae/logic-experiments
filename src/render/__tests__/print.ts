import {
  basic,
  fromProp,
  fromSequent,
  fromRuleId,
  fromPremise,
  fromDerivation,
  type Templates,
} from '../print'
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
import { lk } from '../../systems/lk'

const { a, z, i } = lk

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
      expect(fromProp(atom('p'))(basic)).toBe('🐧')
    })

    it('atom with emoji q', () => {
      expect(fromProp(atom('q'))(basic)).toBe('🦜')
    })

    it('atom with emoji r', () => {
      expect(fromProp(atom('r'))(basic)).toBe('🦃')
    })

    it('atom with emoji s', () => {
      expect(fromProp(atom('s'))(basic)).toBe('🦆')
    })

    it('atom without emoji', () => {
      expect(fromProp(atom('x'))(basic)).toBe('x')
    })

    it('falsum', () => {
      expect(fromProp(falsum)(basic)).toBe('⊥')
    })

    it('verum', () => {
      expect(fromProp(verum)(basic)).toBe('⊤')
    })

    it('negation of atom', () => {
      expect(fromProp(negation(atom('p')))(basic)).toBe('¬🐧')
    })

    it('negation of negation (no parens)', () => {
      expect(fromProp(negation(negation(atom('p'))))(basic)).toBe('¬¬🐧')
    })

    it('negation of falsum (no parens)', () => {
      expect(fromProp(negation(falsum))(basic)).toBe('¬⊥')
    })

    it('negation of conjunction (parenthesized)', () => {
      expect(fromProp(negation(conjunction(atom('p'), atom('q'))))(basic)).toBe(
        '¬(🐧∧🦜)',
      )
    })

    it('negation of disjunction (parenthesized)', () => {
      expect(fromProp(negation(disjunction(atom('p'), atom('q'))))(basic)).toBe(
        '¬(🐧∨🦜)',
      )
    })

    it('negation of implication (parenthesized)', () => {
      expect(fromProp(negation(implication(atom('p'), atom('q'))))(basic)).toBe(
        '¬(🐧→🦜)',
      )
    })

    it('conjunction of atoms', () => {
      expect(fromProp(conjunction(atom('p'), atom('q')))(basic)).toBe('🐧∧🦜')
    })

    it('conjunction of conjunctions (parenthesized)', () => {
      expect(
        fromProp(
          conjunction(
            conjunction(atom('p'), atom('q')),
            conjunction(atom('r'), atom('s')),
          ),
        )(basic),
      ).toBe('(🐧∧🦜)∧(🦃∧🦆)')
    })

    it('conjunction of negation (no parens)', () => {
      expect(fromProp(conjunction(negation(atom('p')), atom('q')))(basic)).toBe(
        '¬🐧∧🦜',
      )
    })

    it('conjunction of disjunction (parenthesized)', () => {
      expect(
        fromProp(conjunction(disjunction(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('(🐧∨🦜)∧🦃')
    })

    it('conjunction of implication (parenthesized)', () => {
      expect(
        fromProp(conjunction(implication(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('(🐧→🦜)∧🦃')
    })

    it('disjunction of atoms', () => {
      expect(fromProp(disjunction(atom('p'), atom('q')))(basic)).toBe('🐧∨🦜')
    })

    it('disjunction of disjunctions (parenthesized)', () => {
      expect(
        fromProp(
          disjunction(
            disjunction(atom('p'), atom('q')),
            disjunction(atom('r'), atom('s')),
          ),
        )(basic),
      ).toBe('(🐧∨🦜)∨(🦃∨🦆)')
    })

    it('disjunction of conjunction (parenthesized)', () => {
      expect(
        fromProp(disjunction(conjunction(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('(🐧∧🦜)∨🦃')
    })

    it('disjunction of implication (parenthesized)', () => {
      expect(
        fromProp(disjunction(implication(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('(🐧→🦜)∨🦃')
    })

    it('implication of atoms', () => {
      expect(fromProp(implication(atom('p'), atom('q')))(basic)).toBe('🐧→🦜')
    })

    it('implication antecedent is implication (parenthesized)', () => {
      expect(
        fromProp(implication(implication(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('(🐧→🦜)→🦃')
    })

    it('implication consequent is implication (parenthesized)', () => {
      expect(
        fromProp(implication(atom('p'), implication(atom('q'), atom('r'))))(
          basic,
        ),
      ).toBe('🐧→(🦜→🦃)')
    })

    it('implication of conjunction (no parens)', () => {
      expect(
        fromProp(implication(conjunction(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('🐧∧🦜→🦃')
    })

    it('implication of disjunction (no parens)', () => {
      expect(
        fromProp(implication(disjunction(atom('p'), atom('q')), atom('r')))(
          basic,
        ),
      ).toBe('🐧∨🦜→🦃')
    })
  })

  describe('fromSequent', () => {
    it('empty antecedent and succedent', () => {
      expect(fromSequent(sequent([], []))(basic)).toBe('⊢')
    })

    it('single formula on each side', () => {
      expect(fromSequent(sequent([atom('p')], [atom('q')]))(basic)).toBe(
        '🐧 ⊢ 🦜',
      )
    })

    it('empty antecedent', () => {
      expect(fromSequent(sequent([], [atom('p')]))(basic)).toBe('⊢ 🐧')
    })

    it('empty succedent', () => {
      expect(fromSequent(sequent([atom('p')], []))(basic)).toBe('🐧 ⊢')
    })

    it('multiple formulas', () => {
      expect(
        fromSequent(sequent([atom('p'), atom('q')], [atom('r'), atom('s')]))(
          basic,
        ),
      ).toBe('🐧,🦜 ⊢ 🦃,🦆')
    })
  })

  describe('fromRuleId', () => {
    it('i', () => {
      expect(fromRuleId('i')(basic)).toBe('I')
    })

    it('f', () => {
      expect(fromRuleId('f')(basic)).toBe('⊥')
    })

    it('v', () => {
      expect(fromRuleId('v')(basic)).toBe('⊤')
    })

    it('il', () => {
      expect(fromRuleId('il')(basic)).toBe('→L')
    })

    it('ir', () => {
      expect(fromRuleId('ir')(basic)).toBe('→R')
    })

    it('cl', () => {
      expect(fromRuleId('cl')(basic)).toBe('∧L')
    })

    it('cr', () => {
      expect(fromRuleId('cr')(basic)).toBe('∧R')
    })

    it('dl', () => {
      expect(fromRuleId('dl')(basic)).toBe('∨L')
    })

    it('dr', () => {
      expect(fromRuleId('dr')(basic)).toBe('∨R')
    })

    it('nl', () => {
      expect(fromRuleId('nl')(basic)).toBe('¬L')
    })

    it('nr', () => {
      expect(fromRuleId('nr')(basic)).toBe('¬R')
    })

    it('swl', () => {
      expect(fromRuleId('swl')(basic)).toBe('WL')
    })

    it('swr', () => {
      expect(fromRuleId('swr')(basic)).toBe('WR')
    })

    it('cl1', () => {
      expect(fromRuleId('cl1')(basic)).toBe('∧L\u2081')
    })

    it('cl2', () => {
      expect(fromRuleId('cl2')(basic)).toBe('∧L\u2082')
    })

    it('dr1', () => {
      expect(fromRuleId('dr1')(basic)).toBe('∨R\u2081')
    })

    it('dr2', () => {
      expect(fromRuleId('dr2')(basic)).toBe('∨R\u2082')
    })

    it('scl', () => {
      expect(fromRuleId('scl')(basic)).toBe('CL')
    })

    it('scr', () => {
      expect(fromRuleId('scr')(basic)).toBe('CR')
    })

    it('sxl', () => {
      expect(fromRuleId('sxl')(basic)).toBe('XL')
    })

    it('sxr', () => {
      expect(fromRuleId('sxr')(basic)).toBe('XR')
    })

    it('sRotLF', () => {
      expect(fromRuleId('sRotLF')(basic)).toBe('\u21B6L')
    })

    it('sRotRF', () => {
      expect(fromRuleId('sRotRF')(basic)).toBe('\u21b7R')
    })

    it('sRotLB', () => {
      expect(fromRuleId('sRotLB')(basic)).toBe('\u21b7L')
    })

    it('sRotRB', () => {
      expect(fromRuleId('sRotRB')(basic)).toBe('\u21B6R')
    })

    it('a1', () => {
      expect(fromRuleId('a1')(basic)).toBe('a1')
    })

    it('a2', () => {
      expect(fromRuleId('a2')(basic)).toBe('a2')
    })

    it('a3', () => {
      expect(fromRuleId('a3')(basic)).toBe('a3')
    })

    it('cut', () => {
      expect(fromRuleId('cut')(basic)).toBe('cut')
    })

    it('mp', () => {
      expect(fromRuleId('mp')(basic)).toBe('mp')
    })
  })

  describe('custom theme', () => {
    it('falsum', () => {
      expect(fromProp(falsum)(custom)).toBe('F')
    })

    it('verum', () => {
      expect(fromProp(verum)(custom)).toBe('T')
    })

    it('atom wrapped', () => {
      expect(fromProp(atom('x'))(custom)).toBe('[x]')
    })

    it('negation', () => {
      expect(fromProp(negation(atom('x')))(custom)).toBe('NOT [x]')
    })

    it('conjunction', () => {
      expect(fromProp(conjunction(atom('x'), atom('y')))(custom)).toBe(
        '[x] AND [y]',
      )
    })

    it('parenthesis template used for nested conjunction', () => {
      expect(
        fromProp(negation(conjunction(atom('x'), atom('y'))))(custom),
      ).toBe('NOT {[x] AND [y]}')
    })

    it('implication', () => {
      expect(fromProp(implication(atom('x'), atom('y')))(custom)).toBe(
        '[x] IMP [y]',
      )
    })

    it('sequent separator', () => {
      expect(fromSequent(sequent([atom('x')], [atom('y')]))(custom)).toBe(
        '[x] PROVES [y]',
      )
    })

    it('formulas separator', () => {
      expect(
        fromSequent(sequent([atom('x'), atom('y')], [atom('z')]))(custom),
      ).toBe('[x]; [y] PROVES [z]')
    })

    it('implication rule label uses theme', () => {
      expect(fromRuleId('il')(custom)).toBe(' IMP L')
    })

    it('conjunction rule label uses theme', () => {
      expect(fromRuleId('cl')(custom)).toBe(' AND L')
    })

    it('disjunction rule label uses theme', () => {
      expect(fromRuleId('dr')(custom)).toBe(' OR R')
    })

    it('negation rule label uses theme', () => {
      expect(fromRuleId('nl')(custom)).toBe('NOT L')
    })
  })

  describe('fromPremise', () => {
    it('renders the sequent as string', () => {
      expect(fromPremise(premise(conclusion(atom('p'))))).toBe('⊢ 🐧')
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
