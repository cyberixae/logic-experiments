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
// in any state), so the pre-Optimization chapters exclude it from their
// challenges' rule sets and hide its button; the Optimization chapter's
// Claims beat introduces it, and later beats keep it.
export const tutorialRules: ReadonlyArray<RuleId> = rkRules.filter(
  (r) => r !== 'cut',
)

// A small atom pool keeps generated goals readable; no constants — ⊥/⊤ are
// the constants beat's material (see constantsNotch), zero-weighted elsewhere.
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

// Source clamp for the Basics constants beat: like the branching notch but
// with ⊥/⊤ in the symbol pool and the constant closings featured — the
// necessity check then guarantees every accepted goal has some branch that
// can only close by f or v. Constants at the inert polarity (⊥ on the
// right, ⊤ on the left) contribute nothing to the closure, so they may
// appear but end up dropped inside the frozen foundation, never at the
// player's frontier.
const constantsNotch: Notch = {
  glyphs: '⊥ ⊤',
  featured: ['f', 'v'],
  taught: ['cl', 'dr', 'nl', 'nr', 'ir', 'cr', 'dl', 'f', 'v'],
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
  symbols: { ...ATOMS, falsum: 2, verum: 2 },
  maxFormulaSize: 2,
  minAnte: 0,
  fallback: sequent([prop.disjunction(prop.falsum, P)], [P]),
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

// Whether solving an atomic leaf forces at least one rotation. Drops always
// remove the ACTIVE formula (last antecedent / first succedent), so a leaf
// closes rotation-free exactly when the same atom sits at the first
// antecedent slot and the last succedent slot — every drop then peels an
// extra without ever touching the keeper. Any other arrangement makes the
// player aim past the keeper, which the gaze UI pays for in rotation
// presses ("far formulas cost more").
const needsRotation = (seq: AnySequent): boolean => {
  const keepLeft = seq.antecedent[0]
  const keepRight = seq.succedent[seq.succedent.length - 1]
  if (keepLeft === undefined || keepRight === undefined) return false
  return !prop.equals(keepLeft, keepRight)
}

const BASICS_TRIES = 50

// A leaf that closes by a constant rule: bare `⊥ ⊢` or bare `⊢ ⊤`.
const isConstantClose = (seq: AnySequent): boolean =>
  (seq.antecedent.length === 1 &&
    seq.succedent.length === 0 &&
    seq.antecedent[0]?.kind === 'falsum') ||
  (seq.antecedent.length === 0 &&
    seq.succedent.length === 1 &&
    seq.succedent[0]?.kind === 'verum')

export type BasicsBeatKind = 'identity' | 'constants' | 'drop'

// A leaf whose identity close matches a compound formula, not a bare atom.
const isCompositeClose = (seq: AnySequent): boolean =>
  seq.antecedent.some((f) => f.kind !== 'atom')

// Mined goals rarely place a compound matched pair inside a forced branch —
// the source notch's necessity check rejects pairs that offer a branch-free
// close — so half the identity candidates come from a template family whose
// fork is necessary and whose branch closes ARE the pair: [A, B] ⊢ A∧B and
// its mirror A∨B ⊢ [A, B], with one of A/B always compound. No implication
// inside the pair, so the goal's closure stays inside the source's taught
// set. The depth cap makes brute close the compound whole (the destructing
// proof is deeper), which is exactly the exemplar the beat wants.
const TEMPLATE_WEIGHTS: ConnectiveWeights = {
  negation: 1,
  implication: 0,
  conjunction: 1,
  disjunction: 1,
}

const templateFormula = (notch: Notch, compound: boolean): prop.Prop => {
  for (;;) {
    // The free slot leans atomic so the guaranteed compound stays the
    // variation, not the norm — most closes in the beat remain bare atoms.
    const size = compound
      ? Math.floor(Math.random() * notch.maxFormulaSize) + 1
      : Math.random() < 0.8
        ? 0
        : Math.floor(Math.random() * notch.maxFormulaSize) + 1
    const f = prop.randomWeighted(size, TEMPLATE_WEIGHTS, notch.symbols)()
    if (!compound || f.kind !== 'atom') return f
  }
}

const identityTemplate = (notch: Notch): ChallengeResult | null => {
  const compound = templateFormula(notch, true)
  const other = templateFormula(notch, false)
  const [a, b] = Math.random() < 0.5 ? [compound, other] : [other, compound]
  const goal =
    Math.random() < 0.5
      ? sequent([a, b], [prop.conjunction(a, b)])
      : sequent([prop.disjunction(a, b)], [a, b])
  const closure = reachableRules(goal)
  if (!closure.every((r) => logicNotches[3].taught.includes(r))) return null
  const [solution] = bruteLimit({ goal, rules: tutorialRules }, MAX_LIMIT)
  return solution === undefined ? null : asResult(solution, 1)
}

// A presolved Basics challenge: a branching-notch challenge (the necessity
// check forces a forking rule into every solution) truncated at a frontier,
// required to leave several open leaves — one button press should never win
// instantly, and drops deferred past branch points repeat across branches,
// which is more practice exactly where it's wanted. The three beats:
// - identity: only the closing moves reopen; every leaf is one Close away,
//   and at least one leaf matches a COMPOUND pair — the winning condition
//   is "the sides match" over arbitrary formulas, so exemplars must vary
//   formula complexity or the player induces the narrower "matching
//   letters win" (and later destructs matches needlessly).
// - constants: same format, sourced with ⊥/⊤ featured — at least one leaf
//   is a bare constant closing, so the new winning conditions are
//   discovered the same way the first one was (the Close button lights up).
// - drop: each branch cut above its topmost connective rule; accepted only
//   when the open leaves are all-atomic (rejects brute solutions not in
//   drop-at-end form) AND at least one leaf forces a Drop (all-identity
//   frontiers would make the lesson dodgeable) AND at least one leaf forces
//   a rotation, so the distance mechanic is met where Drop is first taught.
export const generateBasicsChallenge = (
  kind: BasicsBeatKind,
): ChallengeResult => {
  const source = kind === 'constants' ? constantsNotch : logicNotches[3]
  const prune = kind === 'drop' ? pruneStructural : pruneClosings
  for (let tries = 0; tries < BASICS_TRIES; tries += 1) {
    const res =
      kind === 'identity' && Math.random() < 0.5
        ? identityTemplate(source)
        : generateSequentChallenge(source)
    if (res === null) continue
    const solution = res.challenge.solution
    if (solution === undefined) continue // ChallengeResult types it optional
    const start = prune(solution)
    if (start.kind === 'premise') continue // no frozen foundation at all
    const leaves = frontierLeaves(start)
    if (leaves.length < 2) continue
    if (kind === 'identity' && !leaves.some(isCompositeClose)) continue
    if (kind === 'constants' && !leaves.some(isConstantClose)) continue
    if (kind === 'drop') {
      if (!leaves.every(isAtomic)) continue
      if (!leaves.some(needsDrop)) continue
      if (!leaves.some(needsRotation)) continue
    }
    return { ...res, challenge: { ...res.challenge, start } }
  }
  // Last resort: the source notch's fixed fallback goal, truncated the same
  // way (both fallbacks fork: the disjunction swap, and falsum-or-p ⊢ p).
  const res = fallbackChallenge(source)
  const solution = res.challenge.solution
  if (solution === undefined) return res
  return { ...res, challenge: { ...res.challenge, start: prune(solution) } }
}

// --- Optimization chapter: ordinary challenges with Claim available -------

// The Claims beat teaches cut, and cut can never be made necessary (it is
// admissible — any lemma can be Dropped on both premises, recovering the
// original goal). So unlike every other beat there is no lesson-necessity
// guarantee: the stream is ordinary valid goals over everything taught,
// requiring some connective rule (the structural-only dodge check rejects
// goals that close by drops alone), with the full rule set INCLUDING cut so
// the Claim button is live. Mastery framing, not a gate.
const claimNotch: Notch = {
  glyphs: '',
  featured: ['nl', 'nr', 'cl', 'cr', 'dl', 'dr', 'il', 'ir'],
  taught: ['nl', 'nr', 'cl', 'cr', 'dl', 'dr', 'il', 'ir', 'f', 'v'],
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
  // Hypothetical syllogism — the classic goal a mid-proof claim helps.
  fallback: sequent(
    [prop.implication(P, Q), prop.implication(Q, prop.atom('r'))],
    [prop.implication(P, prop.atom('r'))],
  ),
}

export const generateClaimChallenge = (): ChallengeResult => {
  const res = generateSequentChallenge(claimNotch)
  return { ...res, challenge: { ...res.challenge, rules: rkRules } }
}

// --- Solvability chapter: verifiably unsolvable challenges ---------------

// Everything taught by the end of the Logic chapter (constant closings
// included) — the Skip beat adds no new rules, only the exit.
const solvabilityTaught: ReadonlyArray<RuleId> = [
  ...logicNotches[4].taught,
  'f',
  'v',
]

const connectiveRules: ReadonlyArray<RuleId> = [
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
]

const UNSOLVABLE_WEIGHTS: ConnectiveWeights = {
  negation: 1,
  implication: 1,
  conjunction: 1,
  disjunction: 1,
}

// Fixed fallback: p ∨ q ⊢ p ∧ q — invalid (take p true, q false), with a
// connective on each side to take apart.
const UNSOLVABLE_FALLBACK: AnySequent = sequent(
  [prop.disjunction(P, Q)],
  [prop.conjunction(P, Q)],
)

// No solution attached: the goal is verifiably invalid, hence unprovable.
// A missing solution is already a normal state elsewhere (chaos-mode
// challenges arrive the same way), so downstream display code copes. The
// full rule set (cut included — Claim is taught by the chapter before
// this one, and no claim can rescue an invalid goal) keeps the taught
// verbs available.
const asUnsolvableResult = (
  goal: AnySequent,
  formulasTried: number,
): ChallengeResult => ({
  challenge: { rules: rkRules, goal },
  nonStructuralCount: 0,
  bypassed: true,
  formulasTried,
})

// Generate a verifiably unsolvable challenge for the Skip beat: sampled like
// the notch goals but accepted only when the sequent is NOT valid — classical
// completeness then guarantees no proof exists. The closure clamp keeps every
// formula decomposable with taught rules, so play always bottoms out at an
// atomic dead end (a leaf where nothing closes and nothing destructs), which
// is exactly what the beat wants the player to see; requiring at least one
// connective ensures reaching that dead end takes actual play.
export const generateUnsolvableChallenge = (): ChallengeResult => {
  for (let tries = 0; tries < MAX_TRIES; tries += 1) {
    const nAnte = randomCount()
    const nSucc = randomCount()
    if (nAnte + nSucc === 0 || nAnte + nSucc > MAX_FORMULAS) continue
    const draw = (): prop.Prop => {
      const size = Math.floor(Math.random() * 3)
      return prop.randomWeighted(size, UNSOLVABLE_WEIGHTS, ATOMS)()
    }
    const antecedent = Array.from({ length: nAnte }, draw)
    const succedent = Array.from({ length: nSucc }, draw)
    const goal = sequent(antecedent, succedent)
    if (isValidSequent(goal)) continue
    const closure = reachableRules(goal)
    if (!closure.every((r) => solvabilityTaught.includes(r))) continue
    if (!closure.some((r) => connectiveRules.includes(r))) continue
    return asUnsolvableResult(goal, tries + 1)
  }
  return asUnsolvableResult(UNSOLVABLE_FALLBACK, MAX_TRIES)
}

// --- The curriculum: the tutorial as one addressable, ordered list ------

// A beat = one subchapter: a chapter tag, a name the web layer maps to i18n,
// display glyphs, and a challenge generator for its practice stream.
export type TutorialBeat = {
  chapter: 'basics' | 'logic' | 'optimization' | 'solvability'
  nameId:
    | 'identity'
    | 'constants'
    | 'drop'
    | 'split'
    | 'sideFlip'
    | 'crossing'
    | 'branching'
    | 'branchingCrossing'
    | 'claims'
    | 'unsolvable'
    | 'conjecture'
  glyphs: string
  // The Close beat's only verbs are branch navigation and Close — the Gaze
  // controls (Drop/Destruct selection) aren't relevant yet, so they stay
  // hidden until the Drop beat introduces them.
  hideGaze: boolean
  // Skip stays hidden (button and bindings both) while every goal is
  // solvable — a give-up verb there is pointless or invites quitting; the
  // Solvability chapter's Skip beat introduces it as the correct exit.
  hideSkip: boolean
  // Claim (cut) stays hidden until the Optimization chapter teaches it;
  // from there on the button shows and challenges carry cut in their rule
  // set (the allow-list is the enforcement backstop before that).
  hideLemma: boolean
  // Conjecture beats replace the generated board with the conjecture entry
  // flow: the player composes a formula φ and plays the goal `⊢ φ` they
  // authored. The web layer owns that flow; `generate` is never shown.
  conjecture: boolean
  generate: () => ChallengeResult
}

const LOGIC_NAME_IDS = [
  'sideFlip',
  'crossing',
  'branching',
  'branchingCrossing',
] as const

export const tutorialCurriculum: ReadonlyArray<TutorialBeat> = [
  {
    chapter: 'basics',
    nameId: 'identity',
    glyphs: '',
    hideGaze: true,
    hideSkip: true,
    hideLemma: true,
    conjecture: false,
    generate: () => generateBasicsChallenge('identity'),
  },
  {
    // Same verb as the first beat, new winning conditions — still pure
    // closing, so gaze stays hidden.
    chapter: 'basics',
    nameId: 'constants',
    glyphs: '',
    hideGaze: true,
    hideSkip: true,
    hideLemma: true,
    conjecture: false,
    generate: () => generateBasicsChallenge('constants'),
  },
  {
    chapter: 'basics',
    nameId: 'drop',
    glyphs: '',
    hideGaze: false,
    hideSkip: true,
    hideLemma: true,
    conjecture: false,
    generate: () => generateBasicsChallenge('drop'),
  },
  {
    // The Destruct beat closes Basics: it introduces the third verb on the
    // gentlest rules (∧ left / ∨ right — the pieces stay put), so the verb
    // and its binding are learned before any of its consequences. The
    // Consequences chapter then covers what destructing does everywhere
    // else. Not presolved like the other Basics beats — a full challenge is
    // the point (Close and Drop are already fluent).
    chapter: 'basics',
    nameId: 'split',
    glyphs: '',
    hideGaze: false,
    hideSkip: true,
    hideLemma: true,
    conjecture: false,
    generate: () => generateSequentChallenge(logicNotches[0]),
  },
  // No glyphs on the Consequences rows: the behavior names are unique
  // there, and ladder rows should carry symbols only where the name alone
  // is ambiguous (the two Close beats).
  ...logicNotches.slice(1).map((notch, i) => ({
    chapter: 'logic' as const,
    nameId: LOGIC_NAME_IDS[i] ?? 'sideFlip',
    glyphs: '',
    hideGaze: false,
    hideSkip: true,
    hideLemma: true,
    conjecture: false,
    generate: () => generateSequentChallenge(notch),
  })),
  {
    // The Optimization chapter's Claims beat: ordinary challenges with the
    // Claim button making its first appearance. Claims are optional by
    // nature (cut is admissible), so this is the one beat whose featured
    // verb the goals cannot force.
    chapter: 'optimization',
    nameId: 'claims',
    glyphs: '',
    hideGaze: false,
    hideSkip: true,
    hideLemma: false,
    conjecture: false,
    generate: generateClaimChallenge,
  },
  {
    // The Solvability chapter's Skip beat: deliberately unsolvable goals,
    // announced as such upfront (the honest framing) — the player takes one
    // apart, finds the dead end, and Skip makes its first appearance as the
    // correct exit.
    chapter: 'solvability',
    nameId: 'unsolvable',
    glyphs: '',
    hideGaze: false,
    hideSkip: false,
    hideLemma: false,
    conjecture: false,
    generate: generateUnsolvableChallenge,
  },
  {
    // The Solvability chapter's Conjecture beat: the player composes an
    // arbitrary formula and plays the goal they authored — the first
    // challenge whose solvability nobody has checked. Skip (taught in the
    // previous beat) is the exit when the conjecture turns out false.
    chapter: 'solvability',
    nameId: 'conjecture',
    glyphs: '',
    hideGaze: false,
    hideSkip: false,
    hideLemma: false,
    conjecture: true,
    // Never shown: the web layer swaps this beat's boards for the entry
    // flow; a fixed cheap result keeps the challenge buffer machinery fed.
    generate: () => asUnsolvableResult(UNSOLVABLE_FALLBACK, 0),
  },
]

// Clamp an index into the curriculum, returning a guaranteed beat.
export const beatAt = (i: number): TutorialBeat => {
  const clamped = Math.max(0, Math.min(i, tutorialCurriculum.length - 1))
  return tutorialCurriculum[clamped] ?? tutorialCurriculum[0] ?? beatFail()
}

const beatFail = (): TutorialBeat => {
  throw new Error('empty tutorial curriculum')
}

// The tutorial's navigable positions: each chapter opens with an intro page
// (no board, only the chapter's framing text) followed by its beats, and
// the list ends with a beat-less completion chapter. The web layer walks
// this list; the curriculum above stays the generation source of truth.
export type TutorialChapter = TutorialBeat['chapter'] | 'done'

export type TutorialStop =
  | { kind: 'intro'; chapter: TutorialChapter }
  | { kind: 'beat'; beatIdx: number }

export const tutorialStops: ReadonlyArray<TutorialStop> = (() => {
  const stops: TutorialStop[] = []
  let lastChapter: TutorialBeat['chapter'] | null = null
  tutorialCurriculum.forEach((beat, i) => {
    if (beat.chapter !== lastChapter) {
      lastChapter = beat.chapter
      stops.push({ kind: 'intro', chapter: beat.chapter })
    }
    stops.push({ kind: 'beat', beatIdx: i })
  })
  stops.push({ kind: 'intro', chapter: 'done' })
  return stops
})()

// Clamp an index into the stop list, returning a guaranteed stop.
export const stopAt = (i: number): TutorialStop => {
  const clamped = Math.max(0, Math.min(i, tutorialStops.length - 1))
  return tutorialStops[clamped] ?? tutorialStops[0] ?? stopFail()
}

const stopFail = (): TutorialStop => {
  throw new Error('empty tutorial stop list')
}
