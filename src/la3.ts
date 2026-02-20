import { log } from './lib/block'
import { isProof, premise } from './lib/derivation'
import { conclusion } from './lib/judgement'
import * as print from './lib/print'
import {
  editBranch,
  la3,
  reverseMP,
  tryReverseA1,
  tryReverseA2,
  usage,
} from './systems/la3'

const example = la3.z.mp(
  la3.i.a2(
    la3.a('p'),
    la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
    la3.a('p'),
  ),
  la3.i.a1(
    la3.a('p'),
    la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
  ),
)

const goal = premise(
  conclusion(
    la3.o.p2.implication(
      la3.o.p2.implication(
        la3.a('p'),
        la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
      ),
      la3.o.p2.implication(la3.a('p'), la3.a('p')),
    ),
  ),
)
const step1 = reverseMP(
  goal,
  la3.o.p2.implication(
    la3.a('p'),
    la3.o.p2.implication(
      la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
      la3.a('p'),
    ),
  ),
)
const step2 = editBranch(step1, [0], tryReverseA2)
const step3 = editBranch(step2, [1], tryReverseA1)
if (!step3 || !isProof(step3)) {
  throw step3
}

log(usage)
log()
log('Sandbox')
log()
log(print.fromDerivation(step3))
//log()
//log(print.fromDerivation(example))
log()
log()
