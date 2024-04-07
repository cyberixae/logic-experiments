import { log } from './lib/block'
import * as print from './lib/print'
import { la3, usage } from './systems/la3'

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

log(usage)
log()
log('Sandbox')
log()
log(print.fromDerivation(example))
log()
log()
