import { rev0, lk } from '../systems/lk'
import { AnySequent, conclusion } from '../model/sequent'
import { Configuration } from '../model/theorem'

export const harmaaPuolukkaTiikeri: Configuration<AnySequent> = {
  rules: Object.keys(rev0).filter((r) => ['ir', 'swl', 'i'].includes(r)),
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.o.p2.implication(lk.a('p'), lk.a('p')),
    ),
  ),
  /*
  solution: lk.z.ir(
    lk.z.swl(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.z.ir(lk.i.i(lk.a('p'))),
    ),
  ),*/
}
