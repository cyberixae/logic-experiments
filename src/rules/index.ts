import {
  RuleId,
  Rule,
  TryReverse0,
  TryReverse1,
  TryReverseSplit2,
} from '../model/rule'
import { AnySequent } from '../model/sequent'
import { Option } from '../utils/option'
import { entries } from '../utils/record'
import { ruleA1 } from './a1'
import { ruleA2 } from './a2'
import { ruleA3 } from './a3'
import { ruleCL } from './cl'
import { ruleCL1 } from './cl1'
import { ruleCL2 } from './cl2'
import { ruleCR } from './cr'
import { ruleCut } from './cut'
import { ruleDL } from './dl'
import { ruleFCR } from './fcr'
import { ruleFCut } from './fcut'
import { ruleFDL } from './fdl'
import { ruleFIL } from './fil'
import { ruleDR } from './dr'
import { ruleDR1 } from './dr1'
import { ruleDR2 } from './dr2'
import { ruleF } from './f'
import { ruleI } from './i'
import { ruleIL } from './il'
import { ruleIR } from './ir'
import { ruleMP } from './mp'
import { ruleNL } from './nl'
import { ruleNR } from './nr'
import { ruleSCL } from './scl'
import { ruleSCR } from './scr'
import { ruleSRotLB } from './srotlb'
import { ruleSRotLF } from './srotlf'
import { ruleSRotRB } from './srotrb'
import { ruleSRotRF } from './srotrf'
import { ruleSWL } from './swl'
import { ruleSWR } from './swr'
import { ruleSXL } from './sxl'
import { ruleSXR } from './sxr'
import { ruleV } from './v'

export const rules: {
  [K in RuleId]: Rule<AnySequent, K>
} = {
  a1: ruleA1,
  a2: ruleA2,
  a3: ruleA3,
  cl1: ruleCL1,
  cl2: ruleCL2,
  cl: ruleCL,
  cr: ruleCR,
  cut: ruleCut,
  dl: ruleDL,
  fcr: ruleFCR,
  fcut: ruleFCut,
  fdl: ruleFDL,
  fil: ruleFIL,
  dr1: ruleDR1,
  dr2: ruleDR2,
  dr: ruleDR,
  f: ruleF,
  i: ruleI,
  il: ruleIL,
  ir: ruleIR,
  mp: ruleMP,
  nl: ruleNL,
  nr: ruleNR,
  sRotLB: ruleSRotLB,
  sRotLF: ruleSRotLF,
  sRotRB: ruleSRotRB,
  sRotRF: ruleSRotRF,
  scl: ruleSCL,
  scr: ruleSCR,
  swl: ruleSWL,
  swr: ruleSWR,
  sxl: ruleSXL,
  sxr: ruleSXR,
  v: ruleV,
}

export const applicableRules = (j: AnySequent): Array<RuleId> =>
  entries(rules).flatMap(([k, v]): Option<RuleId> => (v.isResult(j) ? [k] : []))

export const reverseAxiom0 = {
  f: ruleF,
  v: ruleV,
  i: ruleI,
  a1: ruleA1,
  a2: ruleA2,
  a3: ruleA3,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>

export const reverseLogic0 = {
  ir: ruleIR,
  nl: ruleNL,
  nr: ruleNR,
  cl: ruleCL,
  cl1: ruleCL1,
  cl2: ruleCL2,
  dr: ruleDR,
  dr1: ruleDR1,
  dr2: ruleDR2,
  dl: ruleDL,
  cr: ruleCR,
  il: ruleIL,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>

export const reverseStructure0 = {
  swl: ruleSWL,
  swr: ruleSWR,
  scl: ruleSCL,
  scr: ruleSCR,
  sRotLF: ruleSRotLF,
  sRotLB: ruleSRotLB,
  sRotRF: ruleSRotRF,
  sRotRB: ruleSRotRB,
  sxl: ruleSXL,
  sxr: ruleSXR,
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
  fcut: ruleFCut,
  mp: ruleMP,
} satisfies Partial<
  Record<RuleId, Rule<AnySequent> & { tryReverse: TryReverse1 }>
>
export type ReverseId1 = keyof typeof reverse1
export const isReverseId1 = (s: string): s is ReverseId1 => s in reverse1

export const reverseSplit2 = {
  fcr: ruleFCR,
  fdl: ruleFDL,
  fil: ruleFIL,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverseSplit2 }
}>
export type ReverseSplit2Id = keyof typeof reverseSplit2
export const isReverseSplit2Id = (s: string): s is ReverseSplit2Id =>
  s in reverseSplit2

// Exhaustiveness check
const _reverse: { [K in RuleId]: Rule<AnySequent, K> } = {
  ...reverse0,
  ...reverse1,
  ...reverseSplit2,
}

export const center = {
  a1: ruleA1,
  a2: ruleA2,
  a3: ruleA3,
  f: ruleF,
  cut: ruleCut,
  fcut: ruleFCut,
  i: ruleI,
  mp: ruleMP,
  v: ruleV,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const leftStructural = {
  scl: ruleSCL,
  swl: ruleSWL,
  sRotLB: ruleSRotLB,
  sRotLF: ruleSRotLF,
  sxl: ruleSXL,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const leftLogical = {
  nl: ruleNL,
  cl: ruleCL,
  cl1: ruleCL1,
  cl2: ruleCL2,
  dl: ruleDL,
  fdl: ruleFDL,
  il: ruleIL,
  fil: ruleFIL,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const left = {
  ...leftStructural,
  ...leftLogical,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const rightStructural = {
  scr: ruleSCR,
  swr: ruleSWR,
  sRotRB: ruleSRotRB,
  sRotRF: ruleSRotRF,
  sxr: ruleSXR,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const rightLogical = {
  nr: ruleNR,
  dr: ruleDR,
  dr1: ruleDR1,
  dr2: ruleDR2,
  cr: ruleCR,
  fcr: ruleFCR,
  ir: ruleIR,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const right = {
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

// Meta = reverse application requires player-supplied input (reverse1 ∪ reverseSplit2)
export const ruleCategory: { [K in RuleId]: RuleCategory } = {
  a1: 'axiom',
  a2: 'axiom',
  a3: 'axiom',
  f: 'axiom',
  i: 'axiom',
  v: 'axiom',
  scl: 'structural',
  swl: 'structural',
  sRotLB: 'structural',
  sRotLF: 'structural',
  sxl: 'structural',
  scr: 'structural',
  swr: 'structural',
  sRotRB: 'structural',
  sRotRF: 'structural',
  sxr: 'structural',
  nl: 'logical',
  cl: 'logical',
  cl1: 'logical',
  cl2: 'logical',
  dl: 'logical',
  il: 'logical',
  nr: 'logical',
  dr: 'logical',
  dr1: 'logical',
  dr2: 'logical',
  cr: 'logical',
  ir: 'logical',
  cut: 'meta',
  fcut: 'meta',
  mp: 'meta',
  fcr: 'meta',
  fdl: 'meta',
  fil: 'meta',
}
