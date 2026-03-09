import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const syaaniPaprikaKettu: Conjecture<AnyJudgement> = {
  rules: Object.keys(rev) as Array<Rev>,
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.conjunction(
        lk.o.p2.implication(lk.a('p'), lk.a('q')),

        lk.o.p2.disjunction(lk.o.p1.negation(lk.a('q')), lk.a('r')),
      ),
      lk.o.p2.disjunction(lk.o.p1.negation(lk.a('p')), lk.a('r')),
    ),
  ),
}
