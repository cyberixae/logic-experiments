import { log } from './render/block'
import { equalsDerivation, isProof, premise } from './model/derivation'
import { conclusion } from './model/judgement'
import * as print from './render/print'
import { apply, focus, next } from './interactive/focus'
import {
  la3,
  tryReverseA1,
  tryReverseA2,
  tryReverseMP,
  usage,
} from './systems/la3'

const goal = conclusion(
  la3.o.p2.implication(
    la3.o.p2.implication(
      la3.a('p'),
      la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
    ),
    la3.o.p2.implication(la3.a('p'), la3.a('p')),
  ),
)

const proof = la3.z.mp(
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

let cursor = focus(premise(goal))
cursor = apply(
  cursor,
  (d) =>
    tryReverseMP(
      d as any,
      la3.o.p2.implication(
        la3.a('p'),
        la3.o.p2.implication(
          la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
          la3.a('p'),
        ),
      ),
    ) as any,
)
cursor = apply(cursor, tryReverseA2 as any)
cursor = next(cursor)
cursor = apply(cursor, tryReverseA1 as any)
if (
  !cursor ||
  !isProof(cursor.derivation) ||
  !equalsDerivation(cursor.derivation, proof)
) {
  throw cursor
}

log(usage())
log()
log('Sandbox')
log()
log(print.fromDerivation(cursor.derivation))
log()
log()
