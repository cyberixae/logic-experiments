export type PropType =
  | 'atom'
  | 'falsum'
  | 'verum'
  | 'negation'
  | 'implication'
  | 'conjunction'
  | 'disjunction'

export interface PropG<K extends PropType> {
  kind: K
}

export interface Atom<V extends string> extends PropG<'atom'> {
  value: V
}
export const atom = <V extends string>(value: V): Atom<V> => ({
  kind: 'atom',
  value,
})
export const isAtom = (p: Prop): p is Atom<string> => p.kind === 'atom'

export type Falsum = PropG<'falsum'>
export const falsum: Falsum = {
  kind: 'falsum',
}

export type Verum = PropG<'verum'>
export const verum: Verum = {
  kind: 'verum',
}

export interface Negation<N extends Prop> extends PropG<'negation'> {
  negand: N
}
export const negation = <N extends Prop>(negand: N): Negation<N> => ({
  kind: 'negation',
  negand,
})
export const isNegation = (p: Prop): p is Negation<Prop> =>
  p.kind === 'negation'

export interface Implication<A extends Prop, C extends Prop>
  extends PropG<'implication'> {
  antecedent: A
  consequent: C
}
export const implication = <A extends Prop, C extends Prop>(
  antecedent: A,
  consequent: C,
): Implication<A, C> => ({
  kind: 'implication',
  antecedent,
  consequent,
})
export const isImplication = (p: Prop): p is Implication<Prop, Prop> =>
  p.kind === 'implication'

export interface Conjunction<L extends Prop, R extends Prop>
  extends PropG<'conjunction'> {
  leftConjunct: L
  rightConjunct: R
}
export const conjunction = <L extends Prop, R extends Prop>(
  leftConjunct: L,
  rightConjunct: R,
): Conjunction<L, R> => ({
  kind: 'conjunction',
  leftConjunct,
  rightConjunct,
})
export const isConjunction = (p: Prop): p is Conjunction<Prop, Prop> =>
  p.kind === 'conjunction'

export interface Disjunction<L extends Prop, R extends Prop>
  extends PropG<'disjunction'> {
  kind: 'disjunction'
  leftDisjunct: L
  rightDisjunct: R
}
export const disjunction = <L extends Prop, R extends Prop>(
  leftDisjunct: L,
  rightDisjunct: R,
): Disjunction<L, R> => ({
  kind: 'disjunction',
  leftDisjunct,
  rightDisjunct,
})
export const isDisjunction = (p: Prop): p is Disjunction<Prop, Prop> =>
  p.kind === 'disjunction'

export type Prop =
  | Atom<string>
  | Falsum
  | Verum
  | Negation<Prop>
  | Implication<Prop, Prop>
  | Conjunction<Prop, Prop>
  | Disjunction<Prop, Prop>

export const equals = (a: Prop, b: Prop): boolean => {
  switch (a.kind) {
    case 'atom':
      return b.kind === 'atom' && b.value === a.value
    case 'falsum':
      return b.kind === 'falsum'
    case 'verum':
      return b.kind === 'verum'
    case 'negation':
      return b.kind === 'negation' && equals(b.negand, a.negand)
    case 'implication':
      return (
        b.kind === 'implication' &&
        equals(b.antecedent, a.antecedent) &&
        equals(b.consequent, a.consequent)
      )
    case 'conjunction':
      return (
        b.kind === 'conjunction' &&
        equals(b.leftConjunct, a.leftConjunct) &&
        equals(b.rightConjunct, a.rightConjunct)
      )
    case 'disjunction':
      return (
        b.kind === 'disjunction' &&
        equals(b.leftDisjunct, a.leftDisjunct) &&
        equals(b.rightDisjunct, a.rightDisjunct)
      )
  }
}
