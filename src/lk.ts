import { log } from './lib/block'
import * as print from './lib/print'
import { lk, usage } from './systems/lk'

const example = lk.z.ir(
  lk.z.swl(
    lk.o.p2.implication(lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p')))),
    lk.z.ir(lk.i.i(lk.a('p'))),
  ),
)

log(usage)
log()
log('Sandbox')
log()
log(print.fromDerivation(example))
log()
log()
