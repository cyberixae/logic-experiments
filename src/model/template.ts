import * as prop from './prop'
import { Refinement } from '../utils/generic'

interface TemplateVar {
  kind: 'var'
  name: string
}

interface TemplateImp<
  A extends Template = Template,
  B extends Template = Template,
> {
  kind: 'implication'
  antecedent: A
  consequent: B
}

interface TemplateNeg<A extends Template = Template> {
  kind: 'negation'
  negand: A
}

export type Template = TemplateVar | TemplateImp | TemplateNeg

type TemplateShape<T extends Template> = T extends TemplateVar
  ? prop.Prop
  : T extends TemplateImp<infer A, infer B>
    ? prop.Implication<TemplateShape<A>, TemplateShape<B>>
    : T extends TemplateNeg<infer A>
      ? prop.Negation<TemplateShape<A>>
      : never

export const Variable = (name: string): TemplateVar => ({ kind: 'var', name })

export const Implication = <A extends Template, B extends Template>(
  antecedent: A,
  consequent: B,
): TemplateImp<A, B> => ({
  kind: 'implication',
  antecedent,
  consequent,
})

export const Negation = <A extends Template>(negand: A): TemplateNeg<A> => ({
  kind: 'negation',
  negand,
})

export const match = <T extends Template>(
  t: T,
): Refinement<prop.Prop, TemplateShape<T>> => {
  const check = (
    p: prop.Prop,
    t: Template,
    bindings: Map<string, prop.Prop>,
  ): boolean => {
    switch (t.kind) {
      case 'var': {
        const bound = bindings.get(t.name)
        if (bound !== undefined) return prop.equals(bound, p)
        bindings.set(t.name, p)
        return true
      }
      case 'implication':
        return (
          p.kind === 'implication' &&
          check(p.antecedent, t.antecedent, bindings) &&
          check(p.consequent, t.consequent, bindings)
        )
      case 'negation':
        return p.kind === 'negation' && check(p.negand, t.negand, bindings)
    }
  }
  return (p): p is TemplateShape<T> => check(p, t, new Map())
}
