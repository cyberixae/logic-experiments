import { rev, lk, Rev } from '../systems/lk'
import { AnyJudgement, conclusion } from '../model/judgement'
import { Conjecture } from '../model/theorem'

export const violettiLuumuBiisoni: Conjecture<AnyJudgement> = {
  rules: Object.keys(rev) as Array<Rev>,
  goal: conclusion(lk.o.p2.implication(lk.a('p'), lk.a('p'))),
}
