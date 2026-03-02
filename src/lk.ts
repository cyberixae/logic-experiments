import { NonEmptyArray } from './lib/array'
import { log } from './lib/block'
import { premise, editBranch, isProof, AnyDerivation } from './lib/derivation'
import { conclusion } from './lib/judgement'
import * as print from './lib/print'
import { fromDerivation } from './lib/print'
import {
  lk,
  reverseIR,
  tryReverseI,
  tryReverseIR,
  tryReverseSWL,
  usage,
  rev,
} from './systems/lk'

const example = lk.z.ir(
  lk.z.swl(
    lk.o.p2.implication(
      lk.a('p'),
      lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
    ),
    lk.z.ir(lk.i.i(lk.a('p'))),
  ),
)

const goal = premise(
  conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.o.p2.implication(lk.a('p'), lk.a('p')),
    ),
  ),
)

const all = (d: AnyDerivation, p: NonEmptyArray<number>) =>
  Object.entries(rev).map(([_, r]) => {
    const res = editBranch(d, p, r)
    if (res) {
      log()
      log(print.fromDerivation(res))
    }
  })

const step1 = reverseIR(goal)
all(step1, [0])
const step2 = editBranch(step1, [0], tryReverseSWL)
const step3 = editBranch(step2, [0, 0], tryReverseIR)
const step4 = editBranch(step3, [0, 0, 0], tryReverseI)
if (!step4 || !isProof(step4)) {
  throw step4
}

log(usage)
log()
log('Sandbox')
log()
//log(print.fromDerivation(step4))
//log()
//log(print.fromDerivation(example))
log()
log()
