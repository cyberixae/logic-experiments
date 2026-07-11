import * as prop from '../model/prop'
import {
  AnySequent,
  sequent,
  isTautology as isValidSequent,
} from '../model/sequent'
import { RuleId } from '../model/rule'
import { ProofUsing } from '../model/derivation'
import { reachableRules } from '../model/closure'
import { brute, bruteLimit } from '../solver/brute'
import { rules as rkRules } from '../systems/rk'
import { countNonStructural } from './challenge'
import { ConnectiveWeights, SymbolWeights } from './config'
import { ChallengeResult } from '../web/challenge-protocol'

// A tutorial "subchapter": a clamp on challenge generation. The clamp is
// purely generative — the player keeps the full rule set, but untaught rules
// are never *applicable*: a goal is accepted only if its signed subformula
// closure (reachableRules) stays inside the subchapter's taught rules, which
// bounds every move of cut-free backward play. The per-side connective
// weights merely bias the candidate stream toward acceptance; the closure
// check is the guarantee.
export type Notch = {
  // Display glyphs for the connectives featured (not localized — math symbols).
  glyphs: string
  // Newly taught this subchapter; every accepted goal must reach at least one,
  // so practice stays on topic.
  featured: ReadonlyArray<RuleId>
  // All connective rules taught so far (axioms/structural are always taught).
  taught: ReadonlyArray<RuleId>
  anteConnectives: ConnectiveWeights
  succConnectives: ConnectiveWeights
  symbols: SymbolWeights
  maxFormulaSize: number
}

// Cut is the one rule the generative clamp cannot make inapplicable (it applies
// in any state), so it is excluded here and its button hidden — Cut belongs to
// the tutorial's Input chapter.
const tutorialRules: ReadonlyArray<RuleId> = rkRules.filter((r) => r !== 'cut')

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

const NONE: ConnectiveWeights = {
  negation: 0,
  implication: 0,
  conjunction: 0,
  disjunction: 0,
}

// The Logic chapter as five shape-based subchapters, ordered so each step adds
// one idea: same-side split, gate-flip, cross-gate split, branching split, and
// finally implication-left, which combines gate-crossing with branching. Pure
// ∧/∨ goals are generatable because a *sequent* like `p∧q ⊢ p` is valid even
// though the bare formulas aren't — the implication that makes it a tautology
// lives only in the validity check, never in front of the player.
export const logicNotches: readonly [Notch, Notch, Notch, Notch, Notch] = [
  {
    // Same-side split: conjunction-left and disjunction-right — two pieces
    // that stay put. With no gate-flipping connective in the weights, the
    // per-side weights alone keep every candidate inside the clamp.
    glyphs: '∧ ∨',
    featured: ['cl', 'dr'],
    taught: ['cl', 'dr'],
    anteConnectives: { ...NONE, conjunction: 1 },
    succConnectives: { ...NONE, disjunction: 1 },
    symbols: ATOMS,
    maxFormulaSize: 2,
  },
  {
    // Whole-formula gate-flip: negation on either side. From here on the
    // flip means any taught connective can legally sit on either side when
    // negations carry it to its legal polarity (e.g. ¬(A∧B) on the RIGHT
    // flips the conjunction to the left, where cl is taught) — so both
    // sides weight every taught connective and the closure filter rejects
    // the wrong-polarity placements.
    glyphs: '¬',
    featured: ['nl', 'nr'],
    taught: ['cl', 'dr', 'nl', 'nr'],
    anteConnectives: { ...NONE, conjunction: 1, disjunction: 1, negation: 2 },
    succConnectives: { ...NONE, conjunction: 1, disjunction: 1, negation: 2 },
    symbols: ATOMS,
    maxFormulaSize: 2,
  },
  {
    // Cross-gate split: implication-right — split and one piece hops the
    // gate. The bridge to real `⊢ A→B` goals (implication weight covers the
    // antecedent too: ¬(A→B) on the left is legal via the flip).
    glyphs: '→',
    featured: ['ir'],
    taught: ['cl', 'dr', 'nl', 'nr', 'ir'],
    anteConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 1,
    },
    succConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 2,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
  },
  {
    // Branching split: conjunction-right and disjunction-left — the proof
    // forks. Same mirror as subchapter 1, now on the branching sides.
    glyphs: '∧ ∨',
    featured: ['cr', 'dl'],
    taught: ['cl', 'dr', 'nl', 'nr', 'ir', 'cr', 'dl'],
    anteConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 1,
    },
    succConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
  },
  {
    // The capstone: implication-left — gate-crossing and branching combined.
    // Its simplest isolating goals are the modus-ponens shape `p→q, p ⊢ q`.
    glyphs: '→',
    featured: ['il'],
    taught: ['cl', 'dr', 'nl', 'nr', 'ir', 'cr', 'dl', 'il'],
    anteConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 2,
    },
    succConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
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
const MAX_TRIES = 500
// Keep sequents small so proofs stay shallow and generation stays snappy.
const MAX_FORMULAS = 3

const randomCount = (): number => Math.floor(Math.random() * 3) // 0, 1, or 2

const makeFormula = (weights: ConnectiveWeights, notch: Notch): prop.Prop => {
  const size = Math.floor(Math.random() * (notch.maxFormulaSize + 1))
  return prop.randomWeighted(size, weights, notch.symbols)()
}

const asResult = (
  solution: ProofUsing<AnySequent, RuleId>,
  formulasTried: number,
): ChallengeResult => ({
  challenge: { rules: tutorialRules, goal: solution.result, solution },
  nonStructuralCount: countNonStructural(solution),
  bypassed: false,
  formulasTried,
})

// A guaranteed valid goal whose closure ({cl}) fits every subchapter, used
// only if rejection sampling comes up empty.
const fallbackChallenge = (): ChallengeResult => {
  const goal = sequent(
    [prop.conjunction(prop.atom('p'), prop.atom('q'))],
    [prop.atom('p')],
  )
  const [solution] = brute({ goal, rules: tutorialRules })
  return asResult(solution, 0)
}

// Generate a random valid sequent inside the notch's clamp. Mixed shape: 0–2
// formulas per side (at least one total), including the occasional empty
// antecedent `⊢ φ` when it happens to be valid.
export const generateSequentChallenge = (notch: Notch): ChallengeResult => {
  for (let tries = 0; tries < MAX_TRIES; tries += 1) {
    const nAnte = randomCount()
    const nSucc = randomCount()
    if (nAnte + nSucc === 0 || nAnte + nSucc > MAX_FORMULAS) continue
    const antecedent = Array.from({ length: nAnte }, () =>
      makeFormula(notch.anteConnectives, notch),
    )
    const succedent = Array.from({ length: nSucc }, () =>
      makeFormula(notch.succConnectives, notch),
    )
    const goal = sequent(antecedent, succedent)
    const closure = reachableRules(goal)
    // The clamp: nothing untaught is ever reachable…
    if (!closure.every((r) => notch.taught.includes(r))) continue
    // …and the newly taught shape is (practice stays on topic).
    if (!notch.featured.some((r) => closure.includes(r))) continue
    if (!isValidSequent(goal)) continue
    const [solution] = bruteLimit({ goal, rules: tutorialRules }, MAX_LIMIT)
    if (solution === undefined) continue
    return asResult(solution, tries + 1)
  }
  return fallbackChallenge()
}
