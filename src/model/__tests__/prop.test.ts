import {
  atom,
  falsum,
  verum,
  negation,
  implication,
  conjunction,
  disjunction,
  isAtom,
  isNegation,
  isImplication,
  isConjunction,
  isDisjunction,
  match,
  matchRaw,
  equals,
  fold,
  atoms,
  connectives,
  isTautology,
  isFalsifiable,
  isContradiction,
  isSatisfiable,
} from '../prop'

const p = atom('p')
const q = atom('q')

describe('prop', () => {
  describe('constructors', () => {
    it('atom', () => {
      expect(p).toEqual({ kind: 'atom', value: 'p' })
    })

    it('falsum', () => {
      expect(falsum).toEqual({ kind: 'falsum' })
    })

    it('verum', () => {
      expect(verum).toEqual({ kind: 'verum' })
    })

    it('negation', () => {
      expect(negation(p)).toEqual({ kind: 'negation', negand: p })
    })

    it('implication', () => {
      expect(implication(p, q)).toEqual({
        kind: 'implication',
        antecedent: p,
        consequent: q,
      })
    })

    it('conjunction', () => {
      expect(conjunction(p, q)).toEqual({
        kind: 'conjunction',
        leftConjunct: p,
        rightConjunct: q,
      })
    })

    it('disjunction', () => {
      expect(disjunction(p, q)).toEqual({
        kind: 'disjunction',
        leftDisjunct: p,
        rightDisjunct: q,
      })
    })
  })

  describe('type guards', () => {
    it('isAtom', () => {
      expect(isAtom(p)).toBe(true)
      expect(isAtom(falsum)).toBe(false)
    })

    it('isNegation', () => {
      expect(isNegation(negation(p))).toBe(true)
      expect(isNegation(p)).toBe(false)
    })

    it('isImplication', () => {
      expect(isImplication(implication(p, q))).toBe(true)
      expect(isImplication(p)).toBe(false)
    })

    it('isConjunction', () => {
      expect(isConjunction(conjunction(p, q))).toBe(true)
      expect(isConjunction(p)).toBe(false)
    })

    it('isDisjunction', () => {
      expect(isDisjunction(disjunction(p, q))).toBe(true)
      expect(isDisjunction(p)).toBe(false)
    })
  })

  describe('match', () => {
    const kindOf = match(implication(p, q), {
      atom: () => 'atom',
      falsum: () => 'falsum',
      verum: () => 'verum',
      negation: () => 'negation',
      implication: () => 'implication',
      conjunction: () => 'conjunction',
      disjunction: () => 'disjunction',
    })

    it('dispatches to the correct case', () => {
      expect(kindOf).toBe('implication')
    })

    it('passes components to handlers', () => {
      const result = match(implication(p, q), {
        atom: () => null,
        falsum: () => null,
        verum: () => null,
        negation: () => null,
        implication: (a, c) => [a, c],
        conjunction: () => null,
        disjunction: () => null,
      })
      expect(result).toEqual([p, q])
    })

    it('handles all cases', () => {
      const cases = [
        atom('x'),
        falsum,
        verum,
        negation(p),
        implication(p, q),
        conjunction(p, q),
        disjunction(p, q),
      ]
      const handler = {
        atom: () => 'atom',
        falsum: () => 'falsum',
        verum: () => 'verum',
        negation: () => 'negation',
        implication: () => 'implication',
        conjunction: () => 'conjunction',
        disjunction: () => 'disjunction',
      }
      expect(cases.map((c) => match(c, handler))).toEqual([
        'atom',
        'falsum',
        'verum',
        'negation',
        'implication',
        'conjunction',
        'disjunction',
      ])
    })
  })

  describe('matchRaw', () => {
    it('passes the full proposition to handlers', () => {
      const neg = negation(p)
      const result = matchRaw(neg, {
        atom: () => null,
        falsum: () => null,
        verum: () => null,
        negation: (n) => n.negand,
        implication: () => null,
        conjunction: () => null,
        disjunction: () => null,
      })
      expect(result).toEqual(p)
    })
  })

  describe('equals', () => {
    it('atoms with same value are equal', () => {
      expect(equals(atom('p'), atom('p'))).toBe(true)
    })

    it('atoms with different values are not equal', () => {
      expect(equals(p, q)).toBe(false)
    })

    it('falsum equals falsum', () => {
      expect(equals(falsum, falsum)).toBe(true)
    })

    it('verum equals verum', () => {
      expect(equals(verum, verum)).toBe(true)
    })

    it('falsum does not equal verum', () => {
      expect(equals(falsum, verum)).toBe(false)
    })

    it('negation equality is structural', () => {
      expect(equals(negation(p), negation(p))).toBe(true)
      expect(equals(negation(p), negation(q))).toBe(false)
    })

    it('implication equality is structural', () => {
      expect(equals(implication(p, q), implication(p, q))).toBe(true)
      expect(equals(implication(p, q), implication(q, p))).toBe(false)
    })

    it('conjunction equality is structural', () => {
      expect(equals(conjunction(p, q), conjunction(p, q))).toBe(true)
      expect(equals(conjunction(p, q), conjunction(q, p))).toBe(false)
    })

    it('disjunction equality is structural', () => {
      expect(equals(disjunction(p, q), disjunction(p, q))).toBe(true)
      expect(equals(disjunction(p, q), disjunction(q, p))).toBe(false)
    })

    it('different kinds are not equal', () => {
      expect(equals(p, negation(p))).toBe(false)
      expect(equals(conjunction(p, q), disjunction(p, q))).toBe(false)
    })
  })

  describe('fold', () => {
    it('folds a nested proposition', () => {
      // Count the depth of nesting
      const depth = fold(negation(implication(p, q)), {
        atom: () => 0,
        falsum: () => 0,
        verum: () => 0,
        negation: (n) => n + 1,
        implication: (a, c) => Math.max(a, c) + 1,
        conjunction: (l, r) => Math.max(l, r) + 1,
        disjunction: (l, r) => Math.max(l, r) + 1,
      })
      expect(depth).toBe(2)
    })
  })

  describe('atoms', () => {
    it('returns atoms from a proposition', () => {
      expect(atoms(p)).toEqual(['p'])
    })

    it('returns unique atoms from complex proposition', () => {
      expect(atoms(implication(p, conjunction(q, p)))).toEqual(['p', 'q'])
    })

    it('returns empty for falsum', () => {
      expect(atoms(falsum)).toEqual([])
    })

    it('returns empty for verum', () => {
      expect(atoms(verum)).toEqual([])
    })

    it('collects through negation', () => {
      expect(atoms(negation(p))).toEqual(['p'])
    })

    it('collects through disjunction', () => {
      expect(atoms(disjunction(p, q))).toEqual(['p', 'q'])
    })
  })

  describe('connectives', () => {
    it('returns empty for atoms', () => {
      expect(connectives(p)).toEqual([])
    })

    it('returns connectives from nested proposition', () => {
      const result = connectives(implication(negation(p), conjunction(p, q)))
      expect(result).toContain('implication')
      expect(result).toContain('negation')
      expect(result).toContain('conjunction')
    })

    it('returns falsum for falsum', () => {
      expect(connectives(falsum)).toEqual(['falsum'])
    })

    it('returns verum for verum', () => {
      expect(connectives(verum)).toEqual(['verum'])
    })

    it('deduplicates connectives', () => {
      const result = connectives(
        conjunction(conjunction(p, q), conjunction(p, q)),
      )
      const conjCount = result.filter((c) => c === 'conjunction').length
      expect(conjCount).toBe(1)
    })

    it('returns disjunction for disjunction', () => {
      expect(connectives(disjunction(p, q))).toContain('disjunction')
    })
  })

  describe('semantic properties', () => {
    it('p → p is a tautology', () => {
      expect(isTautology(implication(p, p))).toBe(true)
    })

    it('p is not a tautology', () => {
      expect(isTautology(p)).toBe(false)
    })

    it('p is satisfiable', () => {
      expect(isSatisfiable(p)).toBe(true)
    })

    it('p ∧ ¬p is a contradiction', () => {
      expect(isContradiction(conjunction(p, negation(p)))).toBe(true)
    })

    it('p ∧ ¬p is not satisfiable', () => {
      expect(isSatisfiable(conjunction(p, negation(p)))).toBe(false)
    })

    it('p is falsifiable', () => {
      expect(isFalsifiable(p)).toBe(true)
    })

    it('p → p is not falsifiable', () => {
      expect(isFalsifiable(implication(p, p))).toBe(false)
    })

    it('falsum is a contradiction', () => {
      expect(isContradiction(falsum)).toBe(true)
    })

    it('verum is a tautology', () => {
      expect(isTautology(verum)).toBe(true)
    })
  })
})
