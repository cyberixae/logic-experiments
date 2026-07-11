import { AnyDerivation, Derivation, premise } from './derivation'
import { AnySequent } from './sequent'
import { RuleId } from './rule'

// Presolve construction: cut a challenge's solution at a rule-class frontier,
// replacing everything above the cut with open premises. The omitted subtrees
// ARE proofs of those leaves, so the remainder is solvable by construction.
// The truncated tree becomes the challenge's `start` — the frozen foundation
// the player finishes from (proofs build backward, so the presolve sits at
// the bottom near the goal and the player works at the open top).

// Rule classification kept local (like closure.ts's rule mapping) to avoid a
// model → rules dependency.
const CLOSINGS: ReadonlySet<RuleId> = new Set<RuleId>(['i', 'f', 'v'])
// Everything that isn't structural bookkeeping: the eight connective rules,
// plus cut — a cut imports a formula from outside the goal, so a subtree
// using it must stay frozen rather than be reopened for the player.
const NON_STRUCTURAL: ReadonlySet<RuleId> = new Set<RuleId>([
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
  'cut',
])

// Stage-1 frontier: remove only the closing moves, so every open leaf is one
// Close away. The player's first-ever action can be the final Close of a
// real theorem.
export const pruneClosings = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> => {
  if (d.kind === 'premise') return d
  if (CLOSINGS.has(d.rule)) return premise(d.result)
  return { ...d, deps: d.deps.map(pruneClosings) }
}

const containsNonStructural = (d: AnyDerivation): boolean =>
  d.kind === 'transformation' &&
  (NON_STRUCTURAL.has(d.rule) || d.deps.some(containsNonStructural))

// Stage-2 frontier: cut each branch at its topmost connective rule, so the
// open leaves need only structural moves and a Close. With solutions in
// drop-at-end normal form the leaves are all-atomic: the player Drops the
// extras, then Closes.
export const pruneStructural = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> => {
  if (d.kind === 'premise') return d
  if (!containsNonStructural(d)) return premise(d.result)
  return { ...d, deps: d.deps.map(pruneStructural) }
}
