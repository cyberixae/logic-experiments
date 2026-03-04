import { log } from './lib/block'
import { editDerivation, isProof, AnyDerivation, premise } from './lib/derivation'
import { AnyJudgement, conclusion } from './lib/judgement'
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
import { activePath, apply, focus, Focus, undo } from './lib/focus'

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

const status = (s: Focus<AnyJudgement>) => {
  log()
  log()
  log(print.fromDerivation(s.derivation))
  log()
  log(String(s.branch))
  const path = activePath(s)
  log(JSON.stringify(path))
  log()
  log(list(s.derivation, path).join(', '))
  log()
  log()
  log()
}

export const setGoal = <J extends AnyJudgement>(j: J): Focus<J> => focus(premise(j));

const step0 = setGoal(
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
status(step0)
const step1 = apply(step0, tryReverseIR)
status(step1)
const step2 = apply(step1, tryReverseSWL)
status(step2)
const step3 = apply(step2, tryReverseIR)
status(step3)
const step4 = apply(step3, tryReverseI)
status(step4)
if (!step4 || !isProof(step4.derivation)) {
  throw step4
}
const bob = undo(step0)
status(bob)

//log(usage)
//log()
//log('Sandbox')
//log()
//log(print.fromDerivation(step4))
//log()
//log(print.fromDerivation(example))
//log()
//log()
