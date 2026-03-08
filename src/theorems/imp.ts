import { rev, lk } from '../systems/lk'
import { AnyJudgement, conclusion } from '../model/judgement'
import { Theorem } from '../model/theorem'

export const imp: Theorem<AnyJudgement> = {
  rules: Object.keys(rev),
  goal: conclusion(
    lk.o.p2.implication(lk.a('p'), lk.a('p')),
  ),
  solution: lk.z.ir(lk.i.i(lk.a('p'))),
} as any
