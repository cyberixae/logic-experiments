import { NonEmptyArray } from './lib/array'
import { log } from './lib/block'
import { premise, editDerivation, isProof, AnyDerivation, lsDerivation } from './lib/derivation'
import { conclusion } from './lib/judgement'
import * as print from './lib/print'
import {
  lk,
  reverseIR,
  tryReverseI,
  tryReverseIR,
  tryReverseSWL,
  usage,
  rev,
} from './systems/lk'

const list = (d: AnyDerivation, p: Array<number>) =>
  Object.entries(rev).flatMap(([n, r]): [] | [string] => {
    if (editDerivation(d, p, r)) {
      return [n]
    }
    return []
  })

const example = lk.z.ir(
  lk.z.swl(
    lk.o.p2.implication(
      lk.a('p'),
      lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
    ),
    lk.z.ir(lk.i.i(lk.a('p'))),
  ),
)

const status = (d: AnyDerivation | null) => {
  if (!d) {
    return
  }
  log()
  log()
  log(print.fromDerivation(d))
  log()
  lsDerivation(d).forEach((x) => {
    log(JSON.stringify(x) + ': ' + list(d, x).join(', '))
  })
  log()
  log()
  log()
}

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
status(goal)
const step1 = editDerivation(goal, [], tryReverseIR)
status(step1)
const step2 = editDerivation(step1, [0], tryReverseSWL)
status(step2)
const step3 = editDerivation(step2, [0, 0], tryReverseIR)
status(step3)
const step4 = editDerivation(step3, [0, 0, 0], tryReverseI)
status(step4)
if (!step4 || !isProof(step4)) {
  throw step4
}

//log(usage)
//log()
//log('Sandbox')
//log()
//log(print.fromDerivation(step4))
//log()
//log(print.fromDerivation(example))
//log()
//log()
