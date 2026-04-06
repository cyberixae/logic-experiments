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
import { ruleCut } from '../rules/cut'
import { ruleCL } from '../rules/cl'
import { ruleDR } from '../rules/dr'
import { ruleDL } from '../rules/dl'
import { ruleCR } from '../rules/cr'
import { ruleIL } from '../rules/il'
import { ruleIR } from '../rules/ir'
import { ruleNL } from '../rules/nl'
import { ruleNR } from '../rules/nr'
import { ruleSWL } from '../rules/swl'
import { ruleSWR } from '../rules/swr'
import { ruleSRotLF } from '../rules/srotlf'
import { ruleSRotLB } from '../rules/srotlb'
import { ruleSRotRF } from '../rules/srotrf'
import { ruleSRotRB } from '../rules/srotrb'

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
  cut: ruleCut.apply,
  cl: ruleCL.apply,
  dr: ruleDR.apply,
  dl: ruleDL.apply,
  cr: ruleCR.apply,
  il: ruleIL.apply,
  ir: ruleIR.apply,
  nl: ruleNL.apply,
  nr: ruleNR.apply,
  swl: ruleSWL.apply,
  swr: ruleSWR.apply,
  sRotLF: ruleSRotLF.apply,
  sRotLB: ruleSRotLB.apply,
  sRotRF: ruleSRotRF.apply,
  sRotRB: ruleSRotRB.apply,
}

export const name = 'RK'

export const rk = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}
