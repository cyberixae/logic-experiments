import { AnyDerivation, AnyTransformation, Derivation } from './derivation'
import { AnySequent } from './sequent'
import { Split } from './formulas'
import { Refinement } from '../utils/generic'
import type { ConnectiveType } from './prop'
import { Prop } from './prop'
import { Lazy } from '../utils/lazy'
import type { AnyA1 } from '../rules/a1'
import type { AnyA2 } from '../rules/a2'
import type { AnyA3 } from '../rules/a3'
import type { AnyCL } from '../rules/cl'
import type { AnyCL1 } from '../rules/cl1'
import type { AnyCL2 } from '../rules/cl2'
import type { AnyCR } from '../rules/cr'
import type { AnyCut } from '../rules/cut'
import type { AnyDL } from '../rules/dl'
import type { AnyDR } from '../rules/dr'
import type { AnyDR1 } from '../rules/dr1'
import type { AnyDR2 } from '../rules/dr2'
import type { AnyF } from '../rules/f'
import type { AnyFCR } from '../rules/fcr'
import type { AnyFCut } from '../rules/fcut'
import type { AnyFDL } from '../rules/fdl'
import type { AnyFIL } from '../rules/fil'
import type { AnyI } from '../rules/i'
import type { AnyTip } from '../rules/tip'
import type { AnyTiq } from '../rules/tiq'
import type { AnyIL } from '../rules/il'
import type { AnyIR } from '../rules/ir'
import type { AnyMP } from '../rules/mp'
import type { AnyNL } from '../rules/nl'
import type { AnyNR } from '../rules/nr'
import type { AnySCL } from '../rules/scl'
import type { AnySCR } from '../rules/scr'
import type { AnySRotLB } from '../rules/srotlb'
import type { AnySRotLF } from '../rules/srotlf'
import type { AnySRotRB } from '../rules/srotrb'
import type { AnySRotRF } from '../rules/srotrf'
import type { AnySWL } from '../rules/swl'
import type { AnySWR } from '../rules/swr'
import type { AnySXL } from '../rules/sxl'
import type { AnySXR } from '../rules/sxr'
import type { AnyV } from '../rules/v'

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
  | 'fcr'
  | 'fcut'
  | 'fdl'
  | 'fil'
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
  | 'tiq'
  | 'tip'
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
  fcr: 'fcr',
  fcut: 'fcut',
  fdl: 'fdl',
  fil: 'fil',
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
  tiq: 'tiq',
  tip: 'tip',
  v: 'v',
}

export type MatchRuleId<R> = { [K in RuleId]: Lazy<R> }
export const matchRuleId = <R>(s: RuleId, f: MatchRuleId<R>): R => f[s]()

export type AnyRule =
  | AnyA1
  | AnyA2
  | AnyA3
  | AnyCL
  | AnyCL1
  | AnyCL2
  | AnyCR
  | AnyCut
  | AnyDL
  | AnyDR
  | AnyDR1
  | AnyDR2
  | AnyF
  | AnyFCR
  | AnyFCut
  | AnyFDL
  | AnyFIL
  | AnyI
  | AnyIL
  | AnyIR
  | AnyMP
  | AnyNL
  | AnyNR
  | AnySRotLB
  | AnySRotLF
  | AnySRotRB
  | AnySRotRF
  | AnySCL
  | AnySCR
  | AnySWL
  | AnySWR
  | AnySXL
  | AnySXR
  | AnyTiq
  | AnyTip
  | AnyV

export type MatchRuleRaw<R> = {
  a1: (t: AnyA1) => R
  a2: (t: AnyA2) => R
  a3: (t: AnyA3) => R
  cl: (t: AnyCL) => R
  cl1: (t: AnyCL1) => R
  cl2: (t: AnyCL2) => R
  cr: (t: AnyCR) => R
  cut: (t: AnyCut) => R
  dl: (t: AnyDL) => R
  dr: (t: AnyDR) => R
  dr1: (t: AnyDR1) => R
  dr2: (t: AnyDR2) => R
  f: (t: AnyF) => R
  fcr: (t: AnyFCR) => R
  fcut: (t: AnyFCut) => R
  fdl: (t: AnyFDL) => R
  fil: (t: AnyFIL) => R
  i: (t: AnyI) => R
  il: (t: AnyIL) => R
  ir: (t: AnyIR) => R
  mp: (t: AnyMP) => R
  nl: (t: AnyNL) => R
  nr: (t: AnyNR) => R
  sRotLB: (t: AnySRotLB) => R
  sRotLF: (t: AnySRotLF) => R
  sRotRB: (t: AnySRotRB) => R
  sRotRF: (t: AnySRotRF) => R
  scl: (t: AnySCL) => R
  scr: (t: AnySCR) => R
  swl: (t: AnySWL) => R
  swr: (t: AnySWR) => R
  sxl: (t: AnySXL) => R
  sxr: (t: AnySXR) => R
  tiq: (t: AnyTiq) => R
  tip: (t: AnyTip) => R
  v: (t: AnyV) => R
}
export const matchRuleRaw = <R>(
  t: AnyTransformation,
  f: MatchRuleRaw<R>,
): R => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const u = t as AnyRule
  switch (u.rule) {
    case 'a1':
      return f.a1(u)
    case 'a2':
      return f.a2(u)
    case 'a3':
      return f.a3(u)
    case 'cl':
      return f.cl(u)
    case 'cl1':
      return f.cl1(u)
    case 'cl2':
      return f.cl2(u)
    case 'cr':
      return f.cr(u)
    case 'cut':
      return f.cut(u)
    case 'dl':
      return f.dl(u)
    case 'dr':
      return f.dr(u)
    case 'dr1':
      return f.dr1(u)
    case 'dr2':
      return f.dr2(u)
    case 'f':
      return f.f(u)
    case 'fcr':
      return f.fcr(u)
    case 'fcut':
      return f.fcut(u)
    case 'fdl':
      return f.fdl(u)
    case 'fil':
      return f.fil(u)
    case 'i':
      return f.i(u)
    case 'il':
      return f.il(u)
    case 'ir':
      return f.ir(u)
    case 'mp':
      return f.mp(u)
    case 'nl':
      return f.nl(u)
    case 'nr':
      return f.nr(u)
    case 'sRotLB':
      return f.sRotLB(u)
    case 'sRotLF':
      return f.sRotLF(u)
    case 'sRotRB':
      return f.sRotRB(u)
    case 'sRotRF':
      return f.sRotRF(u)
    case 'scl':
      return f.scl(u)
    case 'scr':
      return f.scr(u)
    case 'swl':
      return f.swl(u)
    case 'swr':
      return f.swr(u)
    case 'sxl':
      return f.sxl(u)
    case 'sxr':
      return f.sxr(u)
    case 'tiq':
      return f.tiq(u)
    case 'tip':
      return f.tip(u)
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
export type TryReverseSplit2 = (splitAnt: Split, splitSuc: Split) => TryReverse0
export type TryReverse = TryReverse0 | TryReverse1 | TryReverseSplit2

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
