import {
  Atom,
  atom,
  negation,
  conjunction,
  disjunction,
  implication,
} from '../model/prop'
import * as print from '../render/print'
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

// Language

const alpha = <S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`>(
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

export const rev = {
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
}

export const meta = {
  name: 'Gentzen LK',
  propositions: [
    {
      title: 'Variables',
      examples: [
        [
          alpha('p'),
          alpha('q'),
          alpha('r'),
          alpha('s'),
          alpha('t'),
          alpha('u'),
        ],
      ],
    },
    {
      title: 'Connectives',
      examples: [
        [
          negation(atom('A')),
          implication(atom('A'), atom('B')),
          conjunction(atom('A'), atom('B')),
          disjunction(atom('A'), atom('B')),
        ],
      ],
    },
  ],
  rules: [
    {
      title: 'Axiom',
      examples: [[ruleI.example]],
    },
    {
      title: 'Cut',
      examples: [[ruleCut.example]],
    },
    {
      title: 'Logical Rules',
      examples: [
        [ruleCL1.example, ruleDR1.example],
        [ruleCL2.example, ruleDR2.example],
        [ruleDL.example, ruleCR.example],
        [ruleIL.example, ruleIR.example],
        [ruleNL.example, ruleNR.example],
      ],
    },
    {
      title: 'Structural Rules',
      examples: [
        [ruleSWL.example, ruleSWR.example],
        [ruleSCL.example, ruleSCR.example],
        [ruleSRotLF.example, ruleSRotRF.example],
        [ruleSRotLB.example, ruleSRotRB.example],
        [ruleSXL.example, ruleSXR.example],
      ],
    },
  ],
} as const

export const usage = () => print.fromMeta(meta)

export const lk = {
  a: alpha,
  o: omega,
  i: iota,
  z: zeta,
}

export type Rev = keyof typeof rev
export const isRev = (u: unknown): u is Rev => typeof u === 'string' && u in rev

export const revs = <J extends AnySequent>(
  d: Derivation<J>,
  p: Path,
): Array<[Rev, Derivation<J>]> =>
  entries(rev).flatMap(([rev, ed]): Option<[Rev, Derivation<J>]> => {
    const result = editDerivation(d, p, ed)
    if (result) {
      return [[rev, result]]
    }
    return []
  })
