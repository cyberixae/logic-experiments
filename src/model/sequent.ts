import type { Prop } from './prop'
import * as prop from './prop'
import { zip } from '../utils/array'
import * as array from '../utils/array'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'

export type Formulas = Array<Prop>
export const equalFormulas = (aa: Formulas, ab: Formulas): boolean => {
  return (
    aa.length === ab.length && zip(aa, ab).every(([a, b]) => prop.equals(a, b))
  )
}

export type Sequent<A extends Formulas, S extends Formulas> = {
  kind: 'sequent'
  antecedent: A
  succedent: S
}
export const sequent = <A extends Formulas, S extends Formulas>(
  antecedent: A,
  succedent: S,
): Sequent<A, S> => ({
  kind: 'sequent',
  antecedent,
  succedent,
})
export type AnySequent = Sequent<Formulas, Formulas>

export type ActiveL<B extends Prop> = Sequent<[...Formulas, B], Formulas>
export const isActiveL = (j: AnySequent): j is ActiveL<Prop> => {
  return array.isNonEmptyArray(j.antecedent)
}
export const refineActiveL =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is ActiveL<B> => {
    return isActiveL(j) && r(tuple.last(j.antecedent))
  }

export type ActiveR<B extends Prop> = Sequent<Formulas, [B, ...Formulas]>
export const isActiveR = (j: AnySequent): j is ActiveR<Prop> => {
  return array.isNonEmptyArray(j.succedent)
}
export const refineActiveR =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is ActiveR<B> => {
    return isActiveR(j) && r(tuple.head(j.succedent))
  }

export type Conclusion<P extends Prop> = Sequent<[], [P]>
export const conclusion = <P extends Prop>(proposition: P): Conclusion<P> =>
  sequent([], [proposition])
export type AnyConclusion = Conclusion<Prop>
export const isConclusion = (j: AnySequent): j is AnyConclusion => {
  return j.antecedent.length === 0 && j.succedent.length === 1
}
export const refineConclusion =
  <B extends Prop>(r: Refinement<Prop, B>) =>
  (j: AnySequent): j is Conclusion<B> => {
    return refineActiveR(r)(j)
  }

export const equals = (a: AnySequent, b: AnySequent) => {
  return (
    equalFormulas(a.antecedent, b.antecedent) &&
    equalFormulas(a.succedent, b.succedent)
  )
}

