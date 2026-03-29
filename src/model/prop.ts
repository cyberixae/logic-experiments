import { uniq } from '../utils/array'

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

export type Match<R> = {
  atom: (value: string) => R
  falsum: () => R
  verum: () => R
  negation: (negand: Prop) => R
  implication: (antecedent: Prop, consequent: Prop) => R
  conjunction: (leftConjunct: Prop, rightConjunct: Prop) => R
  disjunction: (leftDisjunct: Prop, rightDisjunct: Prop) => R
}

export const match = <R>(p: Prop, f: Match<R>): R => {
  switch (p.kind) {
    case 'atom':
      return f.atom(p.value)
    case 'falsum':
      return f.falsum()
    case 'verum':
      return f.verum()
    case 'negation':
      return f.negation(p.negand)
    case 'implication':
      return f.implication(p.antecedent, p.consequent)
    case 'conjunction':
      return f.conjunction(p.leftConjunct, p.rightConjunct)
    case 'disjunction':
      return f.disjunction(p.leftDisjunct, p.rightDisjunct)
  }
}

export const equals = (a: Prop, b: Prop): boolean =>
  match(a, {
    atom: (value) => b.kind === 'atom' && b.value === value,
    falsum: () => b.kind === 'falsum',
    verum: () => b.kind === 'verum',
    negation: (negand) => b.kind === 'negation' && equals(b.negand, negand),
    implication: (antecedent, consequent) =>
      b.kind === 'implication' &&
      equals(b.antecedent, antecedent) &&
      equals(b.consequent, consequent),
    conjunction: (leftConjunct, rightConjunct) =>
      b.kind === 'conjunction' &&
      equals(b.leftConjunct, leftConjunct) &&
      equals(b.rightConjunct, rightConjunct),
    disjunction: (leftDisjunct, rightDisjunct) =>
      b.kind === 'disjunction' &&
      equals(b.leftDisjunct, leftDisjunct) &&
      equals(b.rightDisjunct, rightDisjunct),
  })

export type Fold<R> = {
  atom: (value: string) => R
  falsum: () => R
  verum: () => R
  negation: (negand: R) => R
  implication: (antecedent: R, consequent: R) => R
  conjunction: (leftConjunct: R, rightConjunct: R) => R
  disjunction: (leftDisjunct: R, rightDisjunct: R) => R
}

export const fold = <R>(p: Prop, f: Fold<R>): R =>
  match(p, {
    atom: (value) => f.atom(value),
    falsum: () => f.falsum(),
    verum: () => f.verum(),
    negation: (negand) => f.negation(fold(negand, f)),
    implication: (antecedent, consequent) =>
      f.implication(fold(antecedent, f), fold(consequent, f)),
    conjunction: (leftConjunct, rightConjunct) =>
      f.conjunction(fold(leftConjunct, f), fold(rightConjunct, f)),
    disjunction: (leftDisjunct, rightDisjunct) =>
      f.disjunction(fold(leftDisjunct, f), fold(rightDisjunct, f)),
  })

export const atoms = (p: Prop): Array<string> =>
  fold(p, {
    atom: (value) => [value],
    falsum: () => [],
    verum: () => [],
    negation: (negand) => negand,
    implication: (antecedent, consequent) =>
      uniq([...antecedent, ...consequent]),
    conjunction: (leftConjunct, rightConjunct) =>
      uniq([...leftConjunct, ...rightConjunct]),
    disjunction: (leftDisjunct, rightDisjunct) =>
      uniq([...leftDisjunct, ...rightDisjunct]),
  })
