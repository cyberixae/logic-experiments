import { Variable, Implication, Negation, match } from '../template'
import { atom, implication, negation, conjunction } from '../prop'

const P = Variable('P')
const Q = Variable('Q')

describe('template', () => {
  describe('Variable', () => {
    it('matches any atom', () => {
      expect(match(P)(atom('x'))).toBe(true)
    })

    it('matches a compound proposition', () => {
      expect(match(P)(implication(atom('x'), atom('y')))).toBe(true)
    })
  })

  describe('Implication', () => {
    it('matches an implication', () => {
      const t = Implication(P, Q)
      expect(t.kind).toBe('implication')
      expect(match(t)(implication(atom('x'), atom('y')))).toBe(true)
    })

    it('rejects an atom', () => {
      expect(match(Implication(P, Q))(atom('x'))).toBe(false)
    })

    it('rejects a negation', () => {
      expect(match(Implication(P, Q))(negation(atom('x')))).toBe(false)
    })
  })

  describe('Negation', () => {
    it('matches a negation', () => {
      expect(match(Negation(P))(negation(atom('x')))).toBe(true)
    })

    it('rejects an atom', () => {
      expect(match(Negation(P))(atom('x'))).toBe(false)
    })

    it('rejects an implication', () => {
      expect(match(Negation(P))(implication(atom('x'), atom('y')))).toBe(false)
    })
  })

  describe('variable binding', () => {
    it('same variable must match equal propositions', () => {
      const t = Implication(P, P)
      expect(match(t)(implication(atom('x'), atom('x')))).toBe(true)
    })

    it('same variable rejects different propositions', () => {
      const t = Implication(P, P)
      expect(match(t)(implication(atom('x'), atom('y')))).toBe(false)
    })

    it('different variables accept different propositions', () => {
      const t = Implication(P, Q)
      expect(match(t)(implication(atom('x'), atom('y')))).toBe(true)
    })

    it('different variables accept equal propositions', () => {
      const t = Implication(P, Q)
      expect(match(t)(implication(atom('x'), atom('x')))).toBe(true)
    })

    it('binds compound propositions', () => {
      const t = Implication(P, P)
      const compound = implication(atom('a'), atom('b'))
      expect(match(t)(implication(compound, compound))).toBe(true)
    })

    it('rejects structurally different compound propositions', () => {
      const t = Implication(P, P)
      expect(
        match(t)(
          implication(
            implication(atom('a'), atom('b')),
            implication(atom('a'), atom('c')),
          ),
        ),
      ).toBe(false)
    })
  })

  describe('nested templates', () => {
    it('matches axiom 1 shape: p → (q → p)', () => {
      const a1 = Implication(P, Implication(Q, P))
      expect(
        match(a1)(implication(atom('x'), implication(atom('y'), atom('x')))),
      ).toBe(true)
    })

    it('rejects wrong variable in axiom 1 shape', () => {
      const a1 = Implication(P, Implication(Q, P))
      expect(
        match(a1)(implication(atom('x'), implication(atom('y'), atom('y')))),
      ).toBe(false)
    })

    it('matches axiom 3 shape: (¬p → ¬q) → (q → p)', () => {
      const a3 = Implication(
        Implication(Negation(P), Negation(Q)),
        Implication(Q, P),
      )
      expect(
        match(a3)(
          implication(
            implication(negation(atom('a')), negation(atom('b'))),
            implication(atom('b'), atom('a')),
          ),
        ),
      ).toBe(true)
    })

    it('rejects swapped variables in axiom 3 shape', () => {
      const a3 = Implication(
        Implication(Negation(P), Negation(Q)),
        Implication(Q, P),
      )
      expect(
        match(a3)(
          implication(
            implication(negation(atom('a')), negation(atom('b'))),
            implication(atom('a'), atom('b')),
          ),
        ),
      ).toBe(false)
    })
  })

  describe('non-implication/negation connectives', () => {
    it('variable matches conjunction', () => {
      expect(match(P)(conjunction(atom('x'), atom('y')))).toBe(true)
    })

    it('implication template rejects conjunction', () => {
      expect(match(Implication(P, Q))(conjunction(atom('x'), atom('y')))).toBe(
        false,
      )
    })
  })
})
