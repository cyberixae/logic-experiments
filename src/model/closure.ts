import * as array from '../utils/array'
import { Prop, fold } from './prop'
import { AnySequent } from './sequent'
import { RuleId } from './rule'

// Which rules can a cut-free backward proof attempt ever make applicable,
// starting from a given sequent? Backward play only decomposes: every formula
// the player can ever face is a subformula of the goal, on a side determined
// by polarity — negation flips the side of its body, and an implication flips
// the side of its antecedent. Collecting the connective rule for each
// (subformula occurrence, side) pair — plus the falsum/verum axioms where
// those constants can surface — bounds every path a proof attempt can take.
// Identity and the structural rules are omitted: their applicability depends
// on the state's shape, not the goal's content (they apply nearly anywhere).
//
// This is an acceptance check for generated/authored content (assert
// closure ⊆ taught rules), never input enforcement — under the tutorial's
// generative-clamp stance the player always keeps the full rule set.

// Rules reachable from a formula if it sits on the left / on the right of the
// gate; both computed at once so a single bottom-up fold covers the flips.
type SidedRules = {
  left: ReadonlyArray<RuleId>
  right: ReadonlyArray<RuleId>
}

const sidedRules = (p: Prop): SidedRules =>
  fold<SidedRules>(p, {
    atom: () => ({ left: [], right: [] }),
    falsum: () => ({ left: ['f'], right: [] }),
    verum: () => ({ left: [], right: ['v'] }),
    negation: (body) => ({
      left: ['nl', ...body.right],
      right: ['nr', ...body.left],
    }),
    implication: (antecedent, consequent) => ({
      left: ['il', ...antecedent.right, ...consequent.left],
      right: ['ir', ...antecedent.left, ...consequent.right],
    }),
    conjunction: (leftConjunct, rightConjunct) => ({
      left: ['cl', ...leftConjunct.left, ...rightConjunct.left],
      right: ['cr', ...leftConjunct.right, ...rightConjunct.right],
    }),
    disjunction: (leftDisjunct, rightDisjunct) => ({
      left: ['dl', ...leftDisjunct.left, ...rightDisjunct.left],
      right: ['dr', ...leftDisjunct.right, ...rightDisjunct.right],
    }),
  })

// The signed subformula closure of a sequent, as rule ids.
export const reachableRules = (s: AnySequent): ReadonlyArray<RuleId> =>
  array.uniq([
    ...s.antecedent.flatMap((p) => sidedRules(p).left),
    ...s.succedent.flatMap((p) => sidedRules(p).right),
  ])
