import type { Prop } from './prop'
import * as prop from './prop'
import { zip } from '../utils/array'

export type Formulas = Array<Prop>
export const equalFormulas = (aa: Formulas, ab: Formulas): boolean => {
  return (
    aa.length === ab.length && zip(aa, ab).every(([a, b]) => prop.equals(a, b))
  )
}

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
export type AnyConclusion = Conclusion<Prop>

export const equals = (a: AnyJudgement, b: AnyJudgement) => {
  return (
    equalFormulas(a.antecedent, b.antecedent) &&
    equalFormulas(a.succedent, b.succedent)
  )
}
