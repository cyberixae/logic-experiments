import { log } from './render/block'
import { premise, isProof, equalsDerivation } from './model/derivation'
import { conclusion } from './model/sequent'
import { applyEvent, focus } from './interactive/focus'
import { reverse0 } from './interactive/event'

import { alpha, lk, name } from './systems/lk'
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
import { ruleCR } from './rules/cr'
import { ruleCut } from './rules/cut'
import { ruleDL } from './rules/dl'
import { ruleDR1 } from './rules/dr1'
import { ruleDR2 } from './rules/dr2'
import { ruleI } from './rules/i'
import { ruleIL } from './rules/il'
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

const goal = conclusion(
  lk.o.p2.implication(
    lk.o.p2.implication(
      lk.a('p'),
      lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
    ),
    lk.o.p2.implication(lk.a('p'), lk.a('p')),
  ),
)

const proof = lk.z.ir(
  lk.z.swl(
    lk.o.p2.implication(
      lk.a('p'),
      lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
    ),
    lk.z.ir(lk.i.i(lk.a('p'))),
  ),
)

let state = focus(premise(goal))
state = applyEvent(state, reverse0('ir'))
state = applyEvent(state, reverse0('swl'))
state = applyEvent(state, reverse0('ir'))
state = applyEvent(state, reverse0('i'))
if (
  !state ||
  !isProof(state.derivation) ||
  !equalsDerivation(state.derivation, proof)
) {
  throw state
}

log(usage())
log()
log('Sandbox')
log()
log(print.fromDerivation(state.derivation))
log()
log()
