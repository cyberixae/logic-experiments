import { AnyDerivation, Derivation } from './derivation'
import { AnySequent } from './sequent'
import { Refinement } from '../utils/generic'
import { Prop } from './prop'

export type RuleId =
  | 'a1'
  | 'a2'
  | 'a3'
  | 'cl'
  | 'cl1'
  | 'cl2'
  | 'cr'
  | 'cut'
  | 'dl'
  | 'dr'
  | 'dr1'
  | 'dr2'
  | 'i'
  | 'il'
  | 'ir'
  | 'mp'
  | 'nl'
  | 'nr'
  | 'scl'
  | 'scr'
  | 'sRotLB'
  | 'sRotLF'
  | 'sRotRB'
  | 'sRotRF'
  | 'swl'
  | 'swr'
  | 'sxl'
  | 'sxr'
export const ruleId: {
  [K in RuleId]: K
} = {
  a1: 'a1',
  a2: 'a2',
  a3: 'a3',
  cl: 'cl',
  cl1: 'cl1',
  cl2: 'cl2',
  cr: 'cr',
  cut: 'cut',
  dl: 'dl',
  dr: 'dr',
  dr1: 'dr1',
  dr2: 'dr2',
  i: 'i',
  il: 'il',
  ir: 'ir',
  mp: 'mp',
  nl: 'nl',
  nr: 'nr',
  scl: 'scl',
  scr: 'scr',
  sRotLB: 'sRotLB',
  sRotLF: 'sRotLF',
  sRotRB: 'sRotRB',
  sRotRF: 'sRotRF',
  swl: 'swl',
  swr: 'swr',
  sxl: 'sxl',
  sxr: 'sxr',
}

export const isRuleId = (u: unknown): u is RuleId =>
  typeof u === 'string' && u in ruleId

export type TryReverse0 = <J extends AnySequent>(
  d: Derivation<J>,
) => Derivation<J> | null
export type TryReverse1 = (p: Prop) => TryReverse0
export type TryReverse = TryReverse0 | TryReverse1

export interface Rule<R extends AnySequent, I extends RuleId = RuleId> {
  id: I
  isResult: Refinement<AnySequent, R>
  isResultDerivation: Refinement<AnyDerivation, Derivation<R>>
  make: unknown
  apply: unknown
  reverse: unknown
  tryReverse: TryReverse
  example: Derivation<R>
}
