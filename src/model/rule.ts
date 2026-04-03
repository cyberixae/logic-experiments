import { AnyDerivation, Derivation } from './derivation'
import { AnySequent } from './sequent'
import { Refinement } from '../utils/generic'
import { Prop } from './prop'
import { Lazy } from '../utils/lazy'

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
  | 'f'
  | 'i'
  | 'il'
  | 'ir'
  | 'mp'
  | 'nl'
  | 'nr'
  | 'sRotLB'
  | 'sRotLF'
  | 'sRotRB'
  | 'sRotRF'
  | 'scl'
  | 'scr'
  | 'swl'
  | 'swr'
  | 'sxl'
  | 'sxr'
  | 'v'
export const ruleId: {
  [K in RuleId]: K
} = {
  a1: 'a1',
  a2: 'a2',
  a3: 'a3',
  cl1: 'cl1',
  cl2: 'cl2',
  cl: 'cl',
  cr: 'cr',
  cut: 'cut',
  dl: 'dl',
  dr1: 'dr1',
  dr2: 'dr2',
  dr: 'dr',
  f: 'f',
  i: 'i',
  il: 'il',
  ir: 'ir',
  mp: 'mp',
  nl: 'nl',
  nr: 'nr',
  sRotLB: 'sRotLB',
  sRotLF: 'sRotLF',
  sRotRB: 'sRotRB',
  sRotRF: 'sRotRF',
  scl: 'scl',
  scr: 'scr',
  swl: 'swl',
  swr: 'swr',
  sxl: 'sxl',
  sxr: 'sxr',
  v: 'v',
}

export type MatchRuleId<R> = { [K in RuleId]: Lazy<R> }
export const matchRuleId = <R>(s: RuleId, f: MatchRuleId<R>): R => f[s]()

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
