import { AnyDerivation, AnyTransformation, Derivation } from './derivation'
import { AnySequent } from './sequent'
import { Refinement } from '../utils/generic'
import type { ConnectiveType } from './prop'
import { Prop } from './prop'
import { Lazy } from '../utils/lazy'
import type { AnyCL } from '../rules/cl'
import type { AnyCR } from '../rules/cr'
import type { AnyCut } from '../rules/cut'
import type { AnyDL } from '../rules/dl'
import type { AnyDR } from '../rules/dr'
import type { AnyF } from '../rules/f'
import type { AnyI } from '../rules/i'
import type { AnyIL } from '../rules/il'
import type { AnyIR } from '../rules/ir'
import type { AnyNL } from '../rules/nl'
import type { AnyNR } from '../rules/nr'
import type { AnySRotLB } from '../rules/srotlb'
import type { AnySRotRB } from '../rules/srotrb'
import type { AnySWL } from '../rules/swl'
import type { AnySWR } from '../rules/swr'
import type { AnyV } from '../rules/v'

export type RuleId =
  | 'cl'
  | 'cr'
  | 'cut'
  | 'dl'
  | 'dr'
  | 'f'
  | 'i'
  | 'il'
  | 'ir'
  | 'nl'
  | 'nr'
  | 'sRotLB'
  | 'sRotRB'
  | 'swl'
  | 'swr'
  | 'v'
export const ruleId: {
  [K in RuleId]: K
} = {
  cl: 'cl',
  cr: 'cr',
  cut: 'cut',
  dl: 'dl',
  dr: 'dr',
  f: 'f',
  i: 'i',
  il: 'il',
  ir: 'ir',
  nl: 'nl',
  nr: 'nr',
  sRotLB: 'sRotLB',
  sRotRB: 'sRotRB',
  swl: 'swl',
  swr: 'swr',
  v: 'v',
}

export type MatchRuleId<R> = { [K in RuleId]: Lazy<R> }
export const matchRuleId = <R>(s: RuleId, f: MatchRuleId<R>): R => f[s]()

export type AnyRule =
  | AnyCL
  | AnyCR
  | AnyCut
  | AnyDL
  | AnyDR
  | AnyF
  | AnyI
  | AnyIL
  | AnyIR
  | AnyNL
  | AnyNR
  | AnySRotLB
  | AnySRotRB
  | AnySWL
  | AnySWR
  | AnyV

export type MatchRuleRaw<R> = {
  cl: (t: AnyCL) => R
  cr: (t: AnyCR) => R
  cut: (t: AnyCut) => R
  dl: (t: AnyDL) => R
  dr: (t: AnyDR) => R
  f: (t: AnyF) => R
  i: (t: AnyI) => R
  il: (t: AnyIL) => R
  ir: (t: AnyIR) => R
  nl: (t: AnyNL) => R
  nr: (t: AnyNR) => R
  sRotLB: (t: AnySRotLB) => R
  sRotRB: (t: AnySRotRB) => R
  swl: (t: AnySWL) => R
  swr: (t: AnySWR) => R
  v: (t: AnyV) => R
}
export const matchRuleRaw = <R>(
  t: AnyTransformation,
  f: MatchRuleRaw<R>,
): R => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const u = t as AnyRule
  switch (u.rule) {
    case 'cl':
      return f.cl(u)
    case 'cr':
      return f.cr(u)
    case 'cut':
      return f.cut(u)
    case 'dl':
      return f.dl(u)
    case 'dr':
      return f.dr(u)
    case 'f':
      return f.f(u)
    case 'i':
      return f.i(u)
    case 'il':
      return f.il(u)
    case 'ir':
      return f.ir(u)
    case 'nl':
      return f.nl(u)
    case 'nr':
      return f.nr(u)
    case 'sRotLB':
      return f.sRotLB(u)
    case 'sRotRB':
      return f.sRotRB(u)
    case 'swl':
      return f.swl(u)
    case 'swr':
      return f.swr(u)
    case 'v':
      return f.v(u)
  }
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
  connectives: ReadonlyArray<ConnectiveType>
  isResult: Refinement<AnySequent, R>
  isResultDerivation: Refinement<AnyDerivation, Derivation<R>>
  make: unknown
  apply: unknown
  reverse: unknown
  tryReverse: TryReverse
  example: Derivation<R>
}
