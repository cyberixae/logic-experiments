import { rk } from '../../systems/rk'
import { challenges } from '../../challenges'
import { sequent } from '../sequent'
import { reachableRules } from '../closure'
import { AnyDerivation } from '../derivation'
import { RuleId } from '../rule'
import { Prop } from '../prop'

const { a, o } = rk
const p = a('p')
const q = a('q')
const r = a('r')
const { falsum, verum } = o.p0
const { negation } = o.p1
const { implication, conjunction, disjunction } = o.p2

const closure = (
  antecedent: Prop[],
  succedent: Prop[],
): ReadonlyArray<RuleId> =>
  [...reachableRules(sequent(antecedent, succedent))].sort()

describe('reachableRules (signed subformula closure)', () => {
  it('returns nothing for the empty sequent', () => {
    expect(closure([], [])).toEqual([])
  })

  it('returns nothing for atomic sequents', () => {
    expect(closure([p, q], [r])).toEqual([])
  })

  describe('connectives on their own side', () => {
    it('conjunction on the left needs only cl', () => {
      expect(closure([conjunction(p, q)], [p])).toEqual(['cl'])
    })

    it('disjunction on the right needs only dr', () => {
      expect(closure([p], [disjunction(p, q)])).toEqual(['dr'])
    })

    it('implication on the left needs only il when subformulas are atomic', () => {
      expect(closure([implication(p, q)], [])).toEqual(['il'])
    })
  })

  describe('polarity flips', () => {
    it('negation flips its body: negated disjunction on the right reaches dl', () => {
      expect(closure([], [negation(disjunction(p, q))])).toEqual(['dl', 'nr'])
    })

    it('negation flips its body: negated conjunction on the left reaches cr', () => {
      expect(closure([negation(conjunction(p, q))], [])).toEqual(['cr', 'nl'])
    })

    it('implication flips its antecedent: disjunction antecedent on the right reaches dl', () => {
      expect(closure([], [implication(disjunction(p, q), r)])).toEqual([
        'dl',
        'ir',
      ])
    })

    it('implication keeps its consequent: disjunction consequent on the right reaches dr', () => {
      expect(closure([], [implication(p, disjunction(q, r))])).toEqual([
        'dr',
        'ir',
      ])
    })

    it('double negation flips twice: body rules return to the original side', () => {
      expect(closure([negation(negation(conjunction(p, q)))], [])).toEqual([
        'cl',
        'nl',
        'nr',
      ])
    })

    it('composite: implication between compounds on the left', () => {
      // (p∧q)→(r∨p) ⊢ : il splits; p∧q flips right (cr), r∨p stays left (dl)
      expect(
        closure([implication(conjunction(p, q), disjunction(r, p))], []),
      ).toEqual(['cr', 'dl', 'il'])
    })
  })

  describe('constants surface their axiom only at the closing polarity', () => {
    it('falsum on the left reaches f, on the right nothing', () => {
      expect(closure([falsum], [])).toEqual(['f'])
      expect(closure([], [falsum])).toEqual([])
    })

    it('verum on the right reaches v, on the left nothing', () => {
      expect(closure([], [verum])).toEqual(['v'])
      expect(closure([verum], [])).toEqual([])
    })

    it('negation carries a constant across the gate', () => {
      expect(closure([], [negation(falsum)])).toEqual(['f', 'nr'])
    })
  })
})

// The closure must bound every proof: any rule a canonical solution uses on
// formula content (the eight connective rules plus f/v) is reachable from its
// goal. Runs over the whole legacy challenge library as a corpus.
describe('reachableRules bounds every legacy solution', () => {
  const contentRules = new Set<RuleId>([
    'nl',
    'nr',
    'cl',
    'cr',
    'dl',
    'dr',
    'il',
    'ir',
    'f',
    'v',
  ])

  const usedContentRules = (d: AnyDerivation): ReadonlyArray<RuleId> => {
    if (d.kind === 'premise') return []
    const below = d.deps.flatMap(usedContentRules)
    return contentRules.has(d.rule) ? [d.rule, ...below] : below
  }

  const usesCut = (d: AnyDerivation): boolean => {
    if (d.kind === 'premise') return false
    return d.rule === 'cut' || d.deps.some(usesCut)
  }

  Object.entries(challenges).forEach(([key, ch]) => {
    // The closure bounds CUT-FREE play; a solution that cuts a formula in from
    // outside the goal is legitimately outside the bound.
    if (usesCut(ch.solution)) return
    it(`bounds the solution of ${key}`, () => {
      const bound = new Set(reachableRules(ch.goal))
      usedContentRules(ch.solution).forEach((rule) => {
        expect(bound).toContain(rule)
      })
    })
  })
})
