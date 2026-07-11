import * as prop from '../model/prop'
import {
  AnySequent,
  sequent,
  isTautology as isValidSequent,
} from '../model/sequent'
import { RuleId } from '../model/rule'
import {
  AnyDerivation,
  ProofUsing,
  openBranches,
  subDerivation,
} from '../model/derivation'
import { reachableRules } from '../model/closure'
import { pruneClosings, pruneStructural } from '../model/presolve'
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
  // Minimum antecedent formulas. Rules like il can't be *needed* by a goal
  // with an empty left side, so notches whose featured rule lives there floor
  // the draw to keep the rejection-sampling hit rate workable.
  minAnte: number
  // A hand-picked goal that features this notch's rules unavoidably, used
  // only if rejection sampling comes up empty.
  fallback: AnySequent
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

const P = prop.atom('p')
const Q = prop.atom('q')

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
    minAnte: 0,
    fallback: sequent([prop.conjunction(P, Q)], [P]),
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
    minAnte: 0,
    fallback: sequent([P], [prop.negation(prop.negation(P))]),
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
    minAnte: 0,
    fallback: sequent([], [prop.implication(P, P)]),
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
    minAnte: 0,
    fallback: sequent([prop.disjunction(P, Q)], [prop.disjunction(Q, P)]),
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
      implication: 3,
    },
    succConnectives: {
      conjunction: 1,
      disjunction: 1,
      negation: 1,
      implication: 1,
    },
    symbols: ATOMS,
    maxFormulaSize: 2,
    minAnte: 1,
    fallback: sequent([prop.implication(P, Q), P], [Q]),
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
const MAX_TRIES = 1000
// Keep sequents small so proofs stay shallow and generation stays snappy.
const MAX_FORMULAS = 3

const randomCount = (): number => Math.floor(Math.random() * 3) // 0, 1, or 2

const makeFormula = (weights: ConnectiveWeights, notch: Notch): prop.Prop => {
  const size = Math.floor(Math.random() * (notch.maxFormulaSize + 1))
  return prop.randomWeighted(size, weights, notch.symbols)()
}

const subformulas = (f: prop.Prop): prop.Prop[] => {
  switch (f.kind) {
    case 'atom':
    case 'falsum':
    case 'verum':
      return [f]
    case 'negation':
      return [f, ...subformulas(f.negand)]
    case 'implication':
      return [f, ...subformulas(f.antecedent), ...subformulas(f.consequent)]
    case 'conjunction':
      return [
        f,
        ...subformulas(f.leftConjunct),
        ...subformulas(f.rightConjunct),
      ]
    case 'disjunction':
      return [
        f,
        ...subformulas(f.leftDisjunct),
        ...subformulas(f.rightDisjunct),
      ]
  }
}

const pick = <T>(xs: ReadonlyArray<T>): T | undefined =>
  xs[Math.floor(Math.random() * xs.length)]

const asResult = (
  solution: ProofUsing<AnySequent, RuleId>,
  formulasTried: number,
): ChallengeResult => ({
  challenge: { rules: tutorialRules, goal: solution.result, solution },
  nonStructuralCount: countNonStructural(solution),
  bypassed: false,
  formulasTried,
})

const fallbackChallenge = (notch: Notch): ChallengeResult => {
  const [solution] = brute({ goal: notch.fallback, rules: tutorialRules })
  return asResult(solution, 0)
}

// Generate a random valid sequent inside the notch's clamp. Mixed shape: 0–2
// formulas per side (at least one total), including the occasional empty
// antecedent `⊢ φ` when it happens to be valid.
export const generateSequentChallenge = (notch: Notch): ChallengeResult => {
  for (let tries = 0; tries < MAX_TRIES; tries += 1) {
    const nAnte = Math.max(notch.minAnte, randomCount())
    const nSucc = randomCount()
    if (nAnte + nSucc === 0 || nAnte + nSucc > MAX_FORMULAS) continue
    const antecedent = Array.from({ length: nAnte }, () =>
      makeFormula(notch.anteConnectives, notch),
    )
    // Validity needs the two sides to share content, so half the time a
    // succedent slot borrows a subformula of the antecedent instead of
    // drawing fresh — drawing `q` out of `p→q` is what makes modus-ponens
    // shapes (and their kin) findable at all.
    const borrowPool = antecedent.flatMap(subformulas)
    const succedent = Array.from({ length: nSucc }, () => {
      const borrowed =
        borrowPool.length > 0 && Math.random() < 0.5
          ? pick(borrowPool)
          : undefined
      return borrowed ?? makeFormula(notch.succConnectives, notch)
    })
    const goal = sequent(antecedent, succedent)
    const closure = reachableRules(goal)
    // The clamp: nothing untaught is ever reachable…
    if (!closure.every((r) => notch.taught.includes(r))) continue
    // …and the newly taught shape is (cheap pre-filter; necessity below).
    if (!notch.featured.some((r) => closure.includes(r))) continue
    if (!isValidSequent(goal)) continue
    const [solution] = bruteLimit({ goal, rules: tutorialRules }, MAX_LIMIT)
    if (solution === undefined) continue
    // The featured shape must be unavoidable, not merely reachable: if a
    // proof exists that never uses a featured rule (say, Drop the featured
    // formula and Close on the rest), the player can complete the level
    // while dodging the lesson — reject such goals.
    const dodgeRules = tutorialRules.filter((r) => !notch.featured.includes(r))
    const [dodge] = bruteLimit({ goal, rules: dodgeRules }, MAX_LIMIT)
    if (dodge !== undefined) continue
    return asResult(solution, tries + 1)
  }
  return fallbackChallenge(notch)
}

// --- Basics chapter: presolved challenges -------------------------------

const frontierLeaves = (start: AnyDerivation): ReadonlyArray<AnySequent> =>
  openBranches(start).flatMap((path) => {
    const node = subDerivation(start, path)
    return node === null ? [] : [node.result]
  })

const isAtomic = (seq: AnySequent): boolean =>
  [...seq.antecedent, ...seq.succedent].every((f) => f.kind === 'atom')

// An atomic provable leaf closes directly iff it is exactly the identity
// shape (one formula per side); anything larger forces a Drop first.
const needsDrop = (seq: AnySequent): boolean =>
  seq.antecedent.length + seq.succedent.length > 2

const BASICS_TRIES = 50

// A presolved Basics challenge: a branching-notch challenge (its necessity
// check forces a forking rule into every solution) truncated at a frontier,
// required to leave several open leaves — one button press should never win
// instantly, and drops deferred past branch points repeat across branches,
// which is more practice exactly where it's wanted. Stage 1 (Close): only
// the closing moves reopen. Stage 2 (Drop): each branch cut above its
// topmost connective rule; accepted only when the open leaves are all-atomic
// (which rejects brute solutions not in drop-at-end form) AND at least one
// leaf actually forces a Drop — otherwise the beat's lesson is dodgeable by
// closing everything directly.
export const generateBasicsChallenge = (stage: 1 | 2): ChallengeResult => {
  for (let tries = 0; tries < BASICS_TRIES; tries += 1) {
    const res = generateSequentChallenge(logicNotches[3])
    const solution = res.challenge.solution
    if (solution === undefined) continue // ChallengeResult types it optional
    const start =
      stage === 1 ? pruneClosings(solution) : pruneStructural(solution)
    if (start.kind === 'premise') continue // no frozen foundation at all
    const leaves = frontierLeaves(start)
    if (leaves.length < 2) continue
    if (stage === 2 && !leaves.every(isAtomic)) continue
    if (stage === 2 && !leaves.some(needsDrop)) continue
    return { ...res, challenge: { ...res.challenge, start } }
  }
  // Last resort: the branching notch's fixed fallback goal (the disjunction
  // swap, which forks), truncated the same way.
  const res = fallbackChallenge(logicNotches[3])
  const solution = res.challenge.solution
  if (solution === undefined) return res
  const start =
    stage === 1 ? pruneClosings(solution) : pruneStructural(solution)
  return { ...res, challenge: { ...res.challenge, start } }
}

// --- The curriculum: the tutorial as one addressable, ordered list ------

// A beat = one subchapter: a chapter tag, a name the web layer maps to i18n,
// display glyphs, and a challenge generator for its practice stream.
export type TutorialBeat = {
  chapter: 'basics' | 'logic'
  nameId:
    | 'close'
    | 'drop'
    | 'split'
    | 'sideFlip'
    | 'crossing'
    | 'branching'
    | 'branchingCrossing'
  glyphs: string
  // The Close beat's only verbs are branch navigation and Close — the Gaze
  // controls (Drop/Destruct selection) aren't relevant yet, so they stay
  // hidden until the Drop beat introduces them.
  hideGaze: boolean
  generate: () => ChallengeResult
}

const LOGIC_NAME_IDS = [
  'split',
  'sideFlip',
  'crossing',
  'branching',
  'branchingCrossing',
] as const

export const tutorialCurriculum: ReadonlyArray<TutorialBeat> = [
  {
    chapter: 'basics',
    nameId: 'close',
    glyphs: '',
    hideGaze: true,
    generate: () => generateBasicsChallenge(1),
  },
  {
    chapter: 'basics',
    nameId: 'drop',
    glyphs: '',
    hideGaze: false,
    generate: () => generateBasicsChallenge(2),
  },
  ...logicNotches.map((notch, i) => ({
    chapter: 'logic' as const,
    nameId: LOGIC_NAME_IDS[i] ?? 'split',
    glyphs: notch.glyphs,
    hideGaze: false,
    generate: () => generateSequentChallenge(notch),
  })),
]

// Clamp an index into the curriculum, returning a guaranteed beat.
export const beatAt = (i: number): TutorialBeat => {
  const clamped = Math.max(0, Math.min(i, tutorialCurriculum.length - 1))
  return tutorialCurriculum[clamped] ?? tutorialCurriculum[0] ?? beatFail()
}

const beatFail = (): TutorialBeat => {
  throw new Error('empty tutorial curriculum')
}
