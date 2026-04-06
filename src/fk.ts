import { log } from './render/block'
import { premise, isProof, equalsDerivation } from './model/derivation'
import { conclusion } from './model/sequent'
import { applyEvent, focus } from './interactive/focus'
import { reverse0 } from './interactive/event'

import { alpha, fk, name } from './systems/fk'
import {
  negation,
  atom,
  implication,
  conjunction,
  disjunction,
} from './model/prop'
import * as print from './render/print'
import { ruleCL1 } from './rules/cl1'
import { ruleCL2 } from './rules/cl2'
import { ruleDR1 } from './rules/dr1'
import { ruleDR2 } from './rules/dr2'
import { ruleI } from './rules/i'
import { ruleIR } from './rules/ir'
import { ruleNL } from './rules/nl'
import { ruleNR } from './rules/nr'
import { ruleSCL } from './rules/scl'
import { ruleSCR } from './rules/scr'
import { ruleSRotLB } from './rules/srotlb'
import { ruleSRotLF } from './rules/srotlf'
import { ruleSRotRB } from './rules/srotrb'
import { ruleSRotRF } from './rules/srotrf'
import { ruleSWL } from './rules/swl'
import { ruleSWR } from './rules/swr'
import { ruleSXL } from './rules/sxl'
import { ruleSXR } from './rules/sxr'

const meta = {
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
      title: 'Logical Rules',
      examples: [
        [ruleCL1.example, ruleDR1.example],
        [ruleCL2.example, ruleDR2.example],
        [ruleIR.example],
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

const goal = conclusion(
  fk.o.p2.implication(
    fk.o.p2.implication(
      fk.a('p'),
      fk.o.p2.implication(fk.a('q'), fk.o.p1.negation(fk.a('p'))),
    ),
    fk.o.p2.implication(fk.a('p'), fk.a('p')),
  ),
)

const proof = fk.z.ir(
  fk.z.swl(
    fk.o.p2.implication(
      fk.a('p'),
      fk.o.p2.implication(fk.a('q'), fk.o.p1.negation(fk.a('p'))),
    ),
    fk.z.ir(fk.i.i(fk.a('p'))),
  ),
)

let state = focus(premise(goal))
state = applyEvent(state, reverse0('ir'))
state = applyEvent(state, reverse0('swl'))
state = applyEvent(state, reverse0('ir'))
state = applyEvent(state, reverse0('i'))
if (!isProof(state.derivation) || !equalsDerivation(state.derivation, proof)) {
  throw state
}

log(usage())
log()
log('Sandbox')
log()
log(print.fromDerivation(state.derivation))
log()
log()
