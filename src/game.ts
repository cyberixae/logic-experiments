import { Derivation } from "./lib/derivation"
import { Conclusion } from "./lib/judgement"
import { Atom, Implication, Negation, Prop } from "./lib/prop"
import { lk } from './systems/lk'

type Draft<P extends Prop> = {
    
}

type Foo = Implication<Implication<Atom<'p'>, Implication<Atom<'q'>, Negation<Atom<'p'>>>>, Implication<Atom<'p'>, Atom<'p'>>>

const getDerivation = (draft: Draft<Foo>): Derivation<Conclusion<Foo>> => {

  return lk.z.ir(
  lk.z.swl(
    lk.o.p2.implication(lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p')))),
    lk.z.ir(lk.i.i(lk.a('p'))),
  ),
  )

}