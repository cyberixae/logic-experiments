import { alpha, fk, name } from '../systems/fk'
import {
  negation,
  atom,
  implication,
  conjunction,
  disjunction,
  falsum,
  verum,
} from '../model/prop'
import { ruleCL1 } from '../rules/cl1'
import { ruleCL2 } from '../rules/cl2'
import { ruleDR1 } from '../rules/dr1'
import { ruleDR2 } from '../rules/dr2'
import { ruleI } from '../rules/i'
import { ruleIR } from '../rules/ir'
import { ruleNL } from '../rules/nl'
import { ruleNR } from '../rules/nr'
import { ruleV } from '../rules/v'
import { ruleF } from '../rules/f'
import { ruleFCut } from '../rules/fcut'
import { ruleFCR } from '../rules/fcr'
import { ruleFDL } from '../rules/fdl'
import { ruleFIL } from '../rules/fil'
import { ruleSCL } from '../rules/scl'
import { ruleSCR } from '../rules/scr'
import { ruleSRotLB } from '../rules/srotlb'
import { ruleSRotLF } from '../rules/srotlf'
import { ruleSRotRB } from '../rules/srotrb'
import { ruleSRotRF } from '../rules/srotrf'
import { ruleSWL } from '../rules/swl'
import { ruleSWR } from '../rules/swr'
import { ruleSXL } from '../rules/sxl'
import { ruleSXR } from '../rules/sxr'

export const meta = {
  name,
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
          falsum,
          verum,
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
      examples: [[ruleF.example, ruleV.example], [ruleI.example]],
    },
    {
      title: 'Logical Rules',
      examples: [
        [ruleCL1.example, ruleDR1.example],
        [ruleCL2.example, ruleDR2.example],
        [ruleFIL.example, ruleIR.example],
        [ruleFDL.example, ruleFCR.example],
        [ruleNL.example, ruleNR.example],
        [ruleFCut.example],
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

export const exampleProof = fk.z.ir(
  fk.z.swl(
    fk.o.p2.implication(
      fk.a('p'),
      fk.o.p2.implication(fk.a('q'), fk.o.p1.negation(fk.a('p'))),
    ),
    fk.z.ir(fk.i.i(fk.a('p'))),
  ),
)
