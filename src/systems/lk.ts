import {
  Atom,
  atom,
  conjunction,
  disjunction,
  implication,
  negation,
} from '../model/prop'
import { AnySequent as AnySequent } from '../model/sequent'
import {
  Derivation,
  isProof,
  toProof,
  editDerivation,
  Path,
} from '../model/derivation'
import { Option } from '../utils/option'
import { entries } from '../utils/record'
import { ruleI } from '../rules/i'
import { ruleCut } from '../rules/cut'
import { ruleCL } from '../rules/cl'
import { ruleDR } from '../rules/dr'
import { ruleCL1 } from '../rules/cl1'
import { ruleDR1 } from '../rules/dr1'
import { ruleCL2 } from '../rules/cl2'
import { ruleDR2 } from '../rules/dr2'
import { ruleDL } from '../rules/dl'
import { ruleCR } from '../rules/cr'
import { ruleIL } from '../rules/il'
import { ruleIR } from '../rules/ir'
import { ruleNL } from '../rules/nl'
import { ruleNR } from '../rules/nr'
import { ruleSWL } from '../rules/swl'
import { ruleSWR } from '../rules/swr'
import { ruleSCL } from '../rules/scl'
import { ruleSCR } from '../rules/scr'
import { ruleSRotLF } from '../rules/srotlf'
import { ruleSRotLB } from '../rules/srotlb'
import { ruleSRotRF } from '../rules/srotrf'
import { ruleSRotRB } from '../rules/srotrb'
import { ruleSXL } from '../rules/sxl'
import { ruleSXR } from '../rules/sxr'
import { RuleId, TryReverse0, TryReverse1 } from '../model/rule'

// Language

export const alpha = <S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`>(
  s: S,
): Atom<S> => atom(s)
const omega = {
  p0: {},
  p1: { negation },
  p2: { implication, conjunction, disjunction },
}
const iota = {
  i: ruleI.apply,
}
const zeta = {
  cut: ruleCut.apply,
  cl1: ruleCL1.apply,
  dr1: ruleDR1.apply,
  cl2: ruleCL2.apply,
  dr2: ruleDR2.apply,
  dl: ruleDL.apply,
  cr: ruleCR.apply,
  il: ruleIL.apply,
  ir: ruleIR.apply,
  nl: ruleNL.apply,
  nr: ruleNR.apply,
  swl: ruleSWL.apply,
  swr: ruleSWR.apply,
  scl: ruleSCL.apply,
  scr: ruleSCR.apply,
  sRotLF: ruleSRotLF.apply,
  sRotLB: ruleSRotLB.apply,
  sRotRF: ruleSRotRF.apply,
  sRotRB: ruleSRotRB.apply,
  sxl: ruleSXL.apply,
  sxr: ruleSXR.apply,
}

export const rev1  = {
  cut: ruleCut.tryReverse,
} satisfies Partial<Record<RuleId, TryReverse1>>

export const rev0 = {
  i: ruleI.tryReverse,
  cl: ruleCL.tryReverse,
  dr: ruleDR.tryReverse,
  cl1: ruleCL1.tryReverse,
  dr1: ruleDR1.tryReverse,
  cl2: ruleCL2.tryReverse,
  dr2: ruleDR2.tryReverse,
  dl: ruleDL.tryReverse,
  cr: ruleCR.tryReverse,
  il: ruleIL.tryReverse,
  ir: ruleIR.tryReverse,
  nl: ruleNL.tryReverse,
  nr: ruleNR.tryReverse,
  swl: ruleSWL.tryReverse,
  swr: ruleSWR.tryReverse,
  scl: ruleSCL.tryReverse,
  scr: ruleSCR.tryReverse,
  sRotLF: ruleSRotLF.tryReverse,
  sRotLB: ruleSRotLB.tryReverse,
  sRotRF: ruleSRotRF.tryReverse,
  sRotRB: ruleSRotRB.tryReverse,
  sxl: ruleSXL.tryReverse,
  sxr: ruleSXR.tryReverse,
} satisfies Partial<Record<RuleId, TryReverse0>>

const revses = {
  rev0,
  rev1,
}

export const name = 'Gentzen LK'

export const lk = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}

export const applicableRules = <J extends AnySequent>(
  d: Derivation<J>,
  p: Path,
): Array<RuleId> => {
  const foo0: Array<[RuleId, TryReverse0]> = entries(rev0)
  const foo1: Array<[RuleId, TryReverse0]> = entries(rev1).map(([k,v]: [RuleId, TryReverse1]): [RuleId, TryReverse0] => [k, v(atom('test'))])
  const foo: Array<[RuleId, TryReverse0]> = foo0.concat(foo1)
  return foo.flatMap(([rev, ed]): Option<RuleId> => {
    const result = editDerivation(d, p, ed)
    if (result) {
      return [rev]
    }
    return []
  })
}
