import {
  Atom,
  atom,
  conjunction,
  disjunction,
  falsum,
  implication,
  negation,
  verum,
} from '../model/prop'
import { ruleI } from '../rules/i'
import { ruleV } from '../rules/v'
import { ruleF } from '../rules/f'
import { ruleFCut } from '../rules/fcut'
import { ruleFCR } from '../rules/fcr'
import { ruleFDL } from '../rules/fdl'
import { ruleFIL } from '../rules/fil'
import { ruleCL1 } from '../rules/cl1'
import { ruleDR1 } from '../rules/dr1'
import { ruleCL2 } from '../rules/cl2'
import { ruleDR2 } from '../rules/dr2'
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

// Language

export const alpha = <
  S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`,
>(
  s: S,
): Atom<S> => atom(s)
const omega = {
  p0: { falsum, verum },
  p1: { negation },
  p2: { implication, conjunction, disjunction },
}
const iota = {
  i: ruleI.apply,
  v: ruleV.apply,
  f: ruleF.apply,
}
const zeta = {
  fcut: ruleFCut.apply,
  cl1: ruleCL1.apply,
  dr1: ruleDR1.apply,
  cl2: ruleCL2.apply,
  dr2: ruleDR2.apply,
  fdl: ruleFDL.apply,
  fcr: ruleFCR.apply,
  fil: ruleFIL.apply,
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

export const name = 'FK'

export const fk = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}
