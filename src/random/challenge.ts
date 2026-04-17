import { brute, bruteSearch } from '../solver/brute'
import * as seq from '../utils/seq'
import { AnyDerivation, ProofUsing } from '../model/derivation'
import * as prop from '../model/prop'
import { RuleId } from '../model/rule'
import { AnySequent, conclusion } from '../model/sequent'
import { Challenge, Configuration } from '../model/challenge'
import { ConnectiveWeights, RandomConfig, SymbolWeights } from './config'

export type GeneratedChallenge = {
  challenge: Configuration<AnySequent, Array<RuleId>> & {
    solution?: ProofUsing<AnySequent, RuleId>
  }
  nonStructuralCount: number
  bypassed: boolean
  formulasTried: number
  tautologiesFound: number
  solved: number
}

const RULES: Array<RuleId> = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
]

const STRUCTURAL_RULES: ReadonlySet<RuleId> = new Set([
  'swl',
  'swr',
  'scl',
  'scr',
  'sRotLF',
  'sRotLB',
  'sRotRF',
  'sRotRB',
  'sxl',
  'sxr',
])

export const countNonStructural = (d: AnyDerivation): number => {
  if (d.kind === 'premise') return 0
  const self = STRUCTURAL_RULES.has(d.rule) ? 0 : 1
  return self + d.deps.reduce((sum, dep) => sum + countNonStructural(dep), 0)
}

export const random =
  (
    size: number = 10,
    minDifficulty: number = 8,
  ): (() => Challenge<AnySequent, Array<RuleId>>) =>
  (): Challenge<AnySequent, Array<RuleId>> => {
    const rules = RULES
    let solution: ProofUsing<AnySequent, RuleId> | undefined
    while (typeof solution === 'undefined') {
      ;[solution] = seq.head(
        seq.flatMap(
          seq.filter(seq.repeatIO(prop.random(size)), prop.isTautology),
          (tautology) => {
            const [proof, difficulty] = brute({
              goal: conclusion(tautology),
              rules,
            })
            return difficulty < minDifficulty ? seq.empty() : seq.of(proof)
          },
        ),
      )
    }
    return {
      rules,
      goal: solution.result,
      solution,
    }
  }

export type StepProgress = {
  formulasTried: number
  tautologiesFound: number
  solved: number
}

const bellRandom = (min: number, max: number, center?: number): number => {
  const mid = center ?? (min + max) / 2
  const stddev = Math.max(max - mid, mid - min) / 3
  let value: number
  do {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    value = Math.round(mid + z * stddev)
  } while (value < min || value > max)
  return value
}

const CONNECTIVE_KEYS: Array<keyof ConnectiveWeights> = [
  'negation',
  'implication',
  'conjunction',
  'disjunction',
]

const randomSubsetConnectives = (
  connectives: ConnectiveWeights,
): ConnectiveWeights => {
  const keys = CONNECTIVE_KEYS.filter((k) => connectives[k] > 0)
  if (keys.length <= 1) return connectives
  const count = bellRandom(1, keys.length)
  let selected: Set<keyof ConnectiveWeights>
  do {
    const shuffled = keys.sort(() => Math.random() - 0.5)
    selected = new Set(shuffled.slice(0, count))
  } while (selected.size === 1 && selected.has('negation'))
  return {
    negation: selected.has('negation') ? connectives.negation : 0,
    implication: selected.has('implication') ? connectives.implication : 0,
    conjunction: selected.has('conjunction') ? connectives.conjunction : 0,
    disjunction: selected.has('disjunction') ? connectives.disjunction : 0,
  }
}

const SYMBOL_KEYS: Array<keyof SymbolWeights> = [
  'p',
  'q',
  'r',
  's',
  'u',
  'v',
  'falsum',
  'verum',
]

const randomSubsetSymbols = (symbols: SymbolWeights): SymbolWeights => {
  const keys = SYMBOL_KEYS.filter((k) => symbols[k] > 0)
  if (keys.length <= 1) return symbols
  const count = bellRandom(1, keys.length, Math.min(4, keys.length))
  const shuffled = keys.sort(() => Math.random() - 0.5)
  const selected = new Set(shuffled.slice(0, count))
  const result: SymbolWeights = {
    p: 0,
    q: 0,
    r: 0,
    s: 0,
    u: 0,
    v: 0,
    falsum: 0,
    verum: 0,
  }
  for (const k of selected) {
    result[k] = symbols[k]
  }
  return result
}

export function* randomConfiguredStep(
  config: RandomConfig,
  getTimeout: () => number = () => 5000,
): Generator<StepProgress, GeneratedChallenge> {
  const rules = RULES
  const maxDepth = config.targetNonStructural + 10
  const bypass = config.bypassPercent / 100
  let formulasTried = 0
  let tautologiesFound = 0
  let solved = 0
  const progress = (): StepProgress => ({
    formulasTried,
    tautologiesFound,
    solved,
  })

  while (true) {
    const size = bellRandom(1, config.size)
    const connectives = randomSubsetConnectives(config.connectives)
    const symbols = randomSubsetSymbols(config.symbols)
    const formula = prop.randomWeighted(size, connectives, symbols)()
    formulasTried += 1
    yield progress()

    const isBypassed = Math.random() < bypass
    if (isBypassed) {
      return {
        challenge: { rules, goal: conclusion(formula) },
        nonStructuralCount: 0,
        bypassed: true,
        formulasTried,
        tautologiesFound,
        solved,
      }
    }

    if (!prop.isTautology(formula)) continue
    tautologiesFound += 1

    const solver = bruteSearch({ goal: conclusion(formula), rules })
    let proof: ProofUsing<AnySequent, RuleId> | undefined
    let depth = 0
    const solveStart = Date.now()
    while (depth <= maxDepth) {
      const step = solver.next()
      if (step.done === true) {
        proof = step.value[0]
        break
      }
      depth += 1
      if (Date.now() - solveStart > getTimeout()) break
      yield progress()
    }

    if (proof === undefined) continue
    solved += 1
    const nonStructuralCount = countNonStructural(proof)
    if (
      isFinite(config.targetNonStructural) &&
      nonStructuralCount !== config.targetNonStructural
    )
      continue
    return {
      challenge: { rules, goal: proof.result, solution: proof },
      nonStructuralCount,
      bypassed: false,
      formulasTried,
      tautologiesFound,
      solved,
    }
  }
}

export const randomConfigured =
  (config: RandomConfig): (() => GeneratedChallenge) =>
  (): GeneratedChallenge => {
    const gen = randomConfiguredStep(config)
    while (true) {
      const { done, value } = gen.next()
      if (done === true) return value
    }
  }
