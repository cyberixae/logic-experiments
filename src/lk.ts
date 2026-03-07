import { log } from './render/block'
import { premise, isProof, equalsDerivation } from './model/derivation'
import { conclusion } from './model/judgement'
import { applyEvent, focus } from './interactive/focus'
import { reverse } from './interactive/event'
import * as print from './render/print'

import {  lk,  usage,} from './systems/lk'

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

let state = focus(premise(goal));
state = applyEvent(state, reverse('ir'))
state = applyEvent(state, reverse('swl'))
state = applyEvent(state, reverse('ir'))
state = applyEvent(state, reverse('i'))
if (!state || !isProof(state.derivation) || !equalsDerivation(state.derivation, proof)) {
  throw state
}

log(usage)
log()
log('Sandbox')
log()
log(print.fromDerivation(state.derivation))
log()
log()
