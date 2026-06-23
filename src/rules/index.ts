import { RuleId, Rule, TryReverse0, TryReverse1 } from '../model/rule'
import { AnySequent } from '../model/sequent'
import { Option } from '../utils/option'
import { entries } from '../utils/record'
import { ruleCL } from './cl'
import { ruleCR } from './cr'
import { ruleCut } from './cut'
import { ruleDL } from './dl'
import { ruleDR } from './dr'
import { ruleF } from './f'
import { ruleI } from './i'
import { ruleIL } from './il'
import { ruleIR } from './ir'
import { ruleNL } from './nl'
import { ruleNR } from './nr'
import { ruleSRotLB } from './srotlb'
import { ruleSRotRB } from './srotrb'
import { ruleSWL } from './swl'
import { ruleSWR } from './swr'
import { ruleV } from './v'

export const rules: {
  [K in RuleId]: Rule<AnySequent, K>
} = {
  cl: ruleCL,
  cr: ruleCR,
  cut: ruleCut,
  dl: ruleDL,
  dr: ruleDR,
  f: ruleF,
  i: ruleI,
  il: ruleIL,
  ir: ruleIR,
  nl: ruleNL,
  nr: ruleNR,
  sRotLB: ruleSRotLB,
  sRotRB: ruleSRotRB,
  swl: ruleSWL,
  swr: ruleSWR,
  v: ruleV,
}

export const applicableRules = (j: AnySequent): Array<RuleId> =>
  entries(rules).flatMap(([k, v]): Option<RuleId> => (v.isResult(j) ? [k] : []))

export const reverseAxiom0 = {
  f: ruleF,
  v: ruleV,
  i: ruleI,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>

export const reverseLogic0 = {
  ir: ruleIR,
  nl: ruleNL,
  nr: ruleNR,
  cl: ruleCL,
  dr: ruleDR,
  dl: ruleDL,
  cr: ruleCR,
  il: ruleIL,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>

export const reverseStructure0 = {
  swl: ruleSWL,
  swr: ruleSWR,
  sRotLB: ruleSRotLB,
  sRotRB: ruleSRotRB,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>

export const reverse0 = {
  ...reverseAxiom0,
  ...reverseLogic0,
  ...reverseStructure0,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>
export type ReverseId0 = keyof typeof reverse0
export const isReverseId0 = (s: string): s is ReverseId0 => s in reverse0

export const reverse1 = {
  cut: ruleCut,
} satisfies Partial<
  Record<RuleId, Rule<AnySequent> & { tryReverse: TryReverse1 }>
>
export type ReverseId1 = keyof typeof reverse1
export const isReverseId1 = (s: string): s is ReverseId1 => s in reverse1

// Exhaustiveness check
const _reverse: { [K in RuleId]: Rule<AnySequent, K> } = {
  ...reverse0,
  ...reverse1,
}

export const center = {
  cut: ruleCut,
  i: ruleI,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const leftStructural = {
  swl: ruleSWL,
  sRotLB: ruleSRotLB,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const leftLogical = {
  nl: ruleNL,
  cl: ruleCL,
  dl: ruleDL,
  il: ruleIL,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const left = {
  f: ruleF,
  ...leftStructural,
  ...leftLogical,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const rightStructural = {
  swr: ruleSWR,
  sRotRB: ruleSRotRB,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const rightLogical = {
  nr: ruleNR,
  dr: ruleDR,
  cr: ruleCR,
  ir: ruleIR,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const right = {
  v: ruleV,
  ...rightStructural,
  ...rightLogical,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

// Exhaustiveness check
const _side: { [K in RuleId]: Rule<AnySequent, K> } = {
  ...center,
  ...left,
  ...right,
}

export type RuleCategory = 'axiom' | 'structural' | 'logical' | 'meta'

// Meta = reverse application requires player-supplied input (reverse1)
export const ruleCategory: { [K in RuleId]: RuleCategory } = {
  f: 'axiom',
  i: 'axiom',
  v: 'axiom',
  swl: 'structural',
  sRotLB: 'structural',
  swr: 'structural',
  sRotRB: 'structural',
  nl: 'logical',
  cl: 'logical',
  dl: 'logical',
  il: 'logical',
  nr: 'logical',
  dr: 'logical',
  cr: 'logical',
  ir: 'logical',
  cut: 'meta',
}
