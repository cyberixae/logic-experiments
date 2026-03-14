import { Atom, atom, negation, conjunction, disjunction, implication } from '../model/prop'
import * as print from '../render/print'
import {
  AnySequent as AnySequent,
} from '../model/sequent'
import {
  Derivation,
  isProof,
  toProof,
  editDerivation,
  Path,
} from '../model/derivation'
import { Option } from '../utils/option'
import { entries } from '../utils/record'
import { applyI, tryReverseI, exampleI } from '../rules/i'
import { applyCut, exampleCut } from '../rules/cut'
import { applyCL1, tryReverseCL1, exampleCL1 } from '../rules/cl1'
import { applyDR1, tryReverseDR1, exampleDR1 } from '../rules/dr1'
import { applyCL2, tryReverseCL2, exampleCL2 } from '../rules/cl2'
import { applyDR2, tryReverseDR2, exampleDR2 } from '../rules/dr2'
import { applyDL, tryReverseDL, exampleDL } from '../rules/dl'
import { applyCR, tryReverseCR, exampleCR } from '../rules/cr'
import { applyIL, tryReverseIL, exampleIL } from '../rules/il'
import { applyIR, tryReverseIR, exampleIR } from '../rules/ir'
import { applyNL, tryReverseNL, exampleNL } from '../rules/nl'
import { applyNR, tryReverseNR, exampleNR } from '../rules/nr'
import { applySWL, tryReverseSWL, exampleSWL } from '../rules/swl'
import { applySWR, tryReverseSWR, exampleSWR } from '../rules/swr'
import { applySCL, tryReverseSCL, exampleSCL } from '../rules/scl'
import { applySCR, tryReverseSCR, exampleSCR } from '../rules/scr'
import { applySRotLF, tryReverseSRotLF, exampleSRotLF } from '../rules/srotlf'
import { applySRotLB, tryReverseSRotLB, exampleSRotLB } from '../rules/srotlb'
import { applySRotRF, tryReverseSRotRF, exampleSRotRF } from '../rules/srotrf'
import { applySRotRB, tryReverseSRotRB, exampleSRotRB } from '../rules/srotrb'
import { applySXL, tryReverseSXL, exampleSXL } from '../rules/sxl'
import { applySXR, tryReverseSXR, exampleSXR } from '../rules/sxr'

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
  i: applyI,
}
const zeta = {
  cut: applyCut,
  cl1: applyCL1,
  dr1: applyDR1,
  cl2: applyCL2,
  dr2: applyDR2,
  dl: applyDL,
  cr: applyCR,
  il: applyIL,
  ir: applyIR,
  nl: applyNL,
  nr: applyNR,
  swl: applySWL,
  swr: applySWR,
  scl: applySCL,
  scr: applySCR,
  sRotLF: applySRotLF,
  sRotLB: applySRotLB,
  sRotRF: applySRotRF,
  sRotRB: applySRotRB,
  sxl: applySXL,
  sxr: applySXR,
}

export const rev = {
  i: tryReverseI,
  cl1: tryReverseCL1,
  dr1: tryReverseDR1,
  cl2: tryReverseCL2,
  dr2: tryReverseDR2,
  dl: tryReverseDL,
  cr: tryReverseCR,
  il: tryReverseIL,
  ir: tryReverseIR,
  nl: tryReverseNL,
  nr: tryReverseNR,
  swl: tryReverseSWL,
  swr: tryReverseSWR,
  scl: tryReverseSCL,
  scr: tryReverseSCR,
  sRotLF: tryReverseSRotLF,
  sRotLB: tryReverseSRotLB,
  sRotRF: tryReverseSRotRF,
  sRotRB: tryReverseSRotRB,
  sxl: tryReverseSXL,
  sxr: tryReverseSXR,
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
      examples: [exampleI],
    },
    {
      title: 'Cut',
      examples: [[exampleCut]],
    },
    {
      title: 'Logical Rules',
      examples: [
        [exampleCL1, exampleDR1],
        [exampleCL2, exampleDR2],
        [exampleDL, exampleCR],
        [exampleIL, exampleIR],
        [exampleNL, exampleNR],
      ],
    },
    {
      title: 'Structural Rules',
      examples: [
        [exampleSWL, exampleSWR],
        [exampleSCL, exampleSCR],
        [exampleSRotLF, exampleSRotRF],
        [exampleSRotLB, exampleSRotRB],
        [exampleSXL, exampleSXR],
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
