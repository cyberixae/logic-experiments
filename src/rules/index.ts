import { RuleId, Rule, TryReverse0, TryReverse1 } from '../model/rule'
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

export const reverse0 = {
  a1: ruleA1,
  a2: ruleA2,
  a3: ruleA3,
  f: ruleF,
  i: ruleI,
  cl: ruleCL,
  dr: ruleDR,
  cl1: ruleCL1,
  dr1: ruleDR1,
  cl2: ruleCL2,
  dr2: ruleDR2,
  dl: ruleDL,
  cr: ruleCR,
  il: ruleIL,
  ir: ruleIR,
  nl: ruleNL,
  nr: ruleNR,
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
  v: ruleV,
} satisfies Partial<{
  [K in RuleId]: Rule<AnySequent, K> & { tryReverse: TryReverse0 }
}>
export type ReverseId0 = keyof typeof reverse0
export const isReverseId0 = (s: string): s is ReverseId0 => s in reverse0

export const reverse1 = {
  cut: ruleCut,
  mp: ruleMP,
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
  a1: ruleA1,
  a2: ruleA2,
  a3: ruleA3,
  f: ruleF,
  cut: ruleCut,
  i: ruleI,
  mp: ruleMP,
  v: ruleV,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const left = {
  scl: ruleSCL,
  swl: ruleSWL,
  sRotLB: ruleSRotLB,
  sRotLF: ruleSRotLF,
  sxl: ruleSXL,
  nl: ruleNL,
  il: ruleIL,
  cl: ruleCL,
  cl1: ruleCL1,
  cl2: ruleCL2,
  dl: ruleDL,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

export const right = {
  scr: ruleSCR,
  swr: ruleSWR,
  sRotRB: ruleSRotRB,
  sRotRF: ruleSRotRF,
  sxr: ruleSXR,
  nr: ruleNR,
  ir: ruleIR,
  dr: ruleDR,
  dr1: ruleDR1,
  dr2: ruleDR2,
  cr: ruleCR,
} satisfies Partial<{ [K in RuleId]: Rule<AnySequent, K> }>

// Exhaustiveness check
const _side: { [K in RuleId]: Rule<AnySequent, K> } = {
  ...center,
  ...left,
  ...right,
}
