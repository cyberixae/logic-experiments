import type { Prop } from './prop'

export type Formulas = Array<Prop>

export type Judgement<A extends Formulas, S extends Formulas> = {
  kind: 'judgement'
  antecedent: A
  succedent: S
}
export const judgement = <A extends Formulas, S extends Formulas>(
  antecedent: A,
  succedent: S,
): Judgement<A, S> => ({
  kind: 'judgement',
  antecedent,
  succedent,
})
export type AnyJudgement = Judgement<Formulas, Formulas>

export type Conclusion<P extends Prop> = Judgement<[], [P]>
export const conclusion = <P extends Prop>(proposition: P): Conclusion<P> =>
  judgement([], [proposition])
