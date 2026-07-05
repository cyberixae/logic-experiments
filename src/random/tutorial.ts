import * as prop from '../model/prop'
import {
  AnySequent,
  sequent,
  isTautology as isValidSequent,
} from '../model/sequent'
import { RuleId } from '../model/rule'
import { ProofUsing } from '../model/derivation'
import { brute, bruteLimit } from '../solver/brute'
import { countNonStructural } from './challenge'
import { ConnectiveWeights, SymbolWeights } from './config'
import { ChallengeResult } from '../web/challenge-protocol'

// A tutorial "subchapter": a connective clamp plus the cut-free rule allow-list
// the player is limited to. The two halves must stay consistent — the generated
// goal only uses connectives whose rules are in `rules`, so a restricted rule set
// can always solve it. Excluding `cut` (the only rule whose backward application
// can introduce a fresh connective) guarantees the reachable proof space stays
// closed under the taught rules.
export type Notch = {
  // Display glyphs for the connectives in scope (not localized — math symbols).
  glyphs: string
  connectives: ConnectiveWeights
  symbols: SymbolWeights
  maxFormulaSize: number
  rules: ReadonlyArray<RuleId>
}

const AXIOMS: ReadonlyArray<RuleId> = ['i', 'f', 'v']
const STRUCTURAL: ReadonlyArray<RuleId> = ['swl', 'swr', 'sRotLB', 'sRotRB']

// A small atom pool keeps generated goals readable; no constants (⊥/⊤ belong to
// a later chapter, so their symbol weights are 0).
const ATOMS: SymbolWeights = {
  p: 3,
  q: 2,
  r: 1,
  s: 0,
  u: 0,
  v: 0,
  falsum: 0,
  verum: 0,
}

// The Logic chapter, as connective-widening subchapters. Pure ∧/∨ goals are
// generatable here because a *sequent* like `p∧q ⊢ p` is valid even though the
// bare formulas aren't — the implication that makes it a tautology lives only in
// the validity check, never in front of the player.
export const logicNotches: readonly [Notch, Notch, Notch] = [
  {
    glyphs: '∧ ∨',
    connectives: {
      negation: 0,
      implication: 0,
      conjunction: 1,
      disjunction: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
    rules: [...AXIOMS, ...STRUCTURAL, 'cl', 'cr', 'dl', 'dr'],
  },
  {
    glyphs: '∧ ∨ ¬',
    connectives: {
      negation: 1,
      implication: 0,
      conjunction: 1,
      disjunction: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
    rules: [...AXIOMS, ...STRUCTURAL, 'cl', 'cr', 'dl', 'dr', 'nl', 'nr'],
  },
  {
    glyphs: '∧ ∨ ¬ →',
    connectives: {
      negation: 1,
      implication: 1,
      conjunction: 1,
      disjunction: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
    rules: [
      ...AXIOMS,
      ...STRUCTURAL,
      'cl',
      'cr',
      'dl',
      'dr',
      'nl',
      'nr',
      'il',
      'ir',
    ],
  },
]

// Clamp an index into the notch list, returning a guaranteed notch.
export const notchAt = (i: number): Notch => {
  const clamped = Math.max(0, Math.min(i, logicNotches.length - 1))
  return logicNotches[clamped] ?? logicNotches[0]
}

// Depth cap on the brute search per candidate — tutorial goals are meant to be
// easy, and a low cap bounds the synchronous work so generation can't hang the
// UI (implication goals in particular blow up the search at higher depths).
const MAX_LIMIT = 3
const MAX_TRIES = 300
// Keep sequents small so proofs stay shallow and generation stays snappy.
const MAX_FORMULAS = 3

const randomCount = (): number => Math.floor(Math.random() * 3) // 0, 1, or 2

const makeFormula = (notch: Notch): prop.Prop => {
  const size = Math.floor(Math.random() * (notch.maxFormulaSize + 1))
  return prop.randomWeighted(size, notch.connectives, notch.symbols)()
}

const hasConnective = (fs: ReadonlyArray<prop.Prop>): boolean =>
  fs.some((p) => prop.connectives(p).length > 0)

const asResult = (
  notch: Notch,
  solution: ProofUsing<AnySequent, RuleId>,
  formulasTried: number,
): ChallengeResult => ({
  challenge: { rules: notch.rules, goal: solution.result, solution },
  nonStructuralCount: countNonStructural(solution),
  bypassed: false,
  formulasTried,
})

// A guaranteed valid, connective-bearing goal for any notch (∧ and the identity
// axiom are always in scope), used only if rejection sampling comes up empty.
const fallbackChallenge = (notch: Notch): ChallengeResult => {
  const goal = sequent(
    [prop.conjunction(prop.atom('p'), prop.atom('q'))],
    [prop.atom('p')],
  )
  const [solution] = brute({ goal, rules: notch.rules })
  return asResult(notch, solution, 0)
}

// Generate a random valid sequent over the notch's clamped connectives, solvable
// with the notch's rule set. Mixed shape: 0–2 formulas per side (at least one
// total), including the occasional empty antecedent `⊢ φ` when it happens to be
// valid.
export const generateSequentChallenge = (notch: Notch): ChallengeResult => {
  for (let tries = 0; tries < MAX_TRIES; tries += 1) {
    const nAnte = randomCount()
    const nSucc = randomCount()
    if (nAnte + nSucc === 0 || nAnte + nSucc > MAX_FORMULAS) continue
    const antecedent = Array.from({ length: nAnte }, () => makeFormula(notch))
    const succedent = Array.from({ length: nSucc }, () => makeFormula(notch))
    // Require at least one connective so there is something to Destruct.
    if (!hasConnective([...antecedent, ...succedent])) continue
    const goal = sequent(antecedent, succedent)
    if (!isValidSequent(goal)) continue
    const [solution] = bruteLimit({ goal, rules: notch.rules }, MAX_LIMIT)
    if (solution === undefined) continue
    return asResult(notch, solution, tries + 1)
  }
  return fallbackChallenge(notch)
}
