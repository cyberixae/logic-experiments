import { alpha, rk, name } from '../systems/rk'
import {
  negation,
  atom,
  implication,
  conjunction,
  disjunction,
  falsum,
  verum,
} from '../model/prop'
import { ruleCL } from '../rules/cl'
import { ruleCR } from '../rules/cr'
import { ruleCut } from '../rules/cut'
import { ruleDL } from '../rules/dl'
import { ruleDR } from '../rules/dr'
import { ruleI } from '../rules/i'
import { ruleIL } from '../rules/il'
import { ruleIR } from '../rules/ir'
import { ruleNL } from '../rules/nl'
import { ruleNR } from '../rules/nr'
import { ruleSRotLB } from '../rules/srotlb'
import { ruleSRotLF } from '../rules/srotlf'
import { ruleSRotRB } from '../rules/srotrb'
import { ruleSRotRF } from '../rules/srotrf'
import { ruleV } from '../rules/v'
import { ruleF } from '../rules/f'
import { ruleSWL } from '../rules/swl'
import { ruleSWR } from '../rules/swr'

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
      title: 'Cut',
      examples: [[ruleCut.example]],
    },
    {
      title: 'Logical Rules',
      examples: [
        [ruleCL.example, ruleDR.example],
        [ruleDL.example, ruleCR.example],
        [ruleIL.example, ruleIR.example],
        [ruleNL.example, ruleNR.example],
      ],
    },
    {
      title: 'Structural Rules',
      examples: [
        [ruleSWL.example, ruleSWR.example],
        [ruleSRotLF.example, ruleSRotRF.example],
        [ruleSRotLB.example, ruleSRotRB.example],
      ],
    },
  ],
} as const

export const exampleProof = rk.z.ir(
  rk.z.swl(
    rk.o.p2.implication(
      rk.a('p'),
      rk.o.p2.implication(rk.a('q'), rk.o.p1.negation(rk.a('p'))),
    ),
    rk.z.ir(rk.i.i(rk.a('p'))),
  ),
)
