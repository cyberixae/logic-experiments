import * as array from '../utils/array'
import * as seq from '../utils/seq'
import { splitAt } from '../utils/number'
import { isCountermodel, isModel, Valuation, valuations } from './valuation'

export type ConnectiveType =
  | 'falsum'
  | 'verum'
  | 'negation'
  | 'implication'
  | 'conjunction'
  | 'disjunction'

export type PropType = 'atom' | ConnectiveType

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

export interface Implication<
  A extends Prop,
  C extends Prop,
> extends PropG<'implication'> {
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

export interface Conjunction<
  L extends Prop,
  R extends Prop,
> extends PropG<'conjunction'> {
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

export interface Disjunction<
  L extends Prop,
  R extends Prop,
> extends PropG<'disjunction'> {
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

export type MatchRaw<R> = {
  atom: (p: Atom<string>) => R
  falsum: (p: Falsum) => R
  verum: (p: Verum) => R
  negation: (p: Negation<Prop>) => R
  implication: (p: Implication<Prop, Prop>) => R
  conjunction: (p: Conjunction<Prop, Prop>) => R
  disjunction: (p: Disjunction<Prop, Prop>) => R
}

export const matchRaw = <R>(p: Prop, f: MatchRaw<R>): R => {
  switch (p.kind) {
    case 'atom':
      return f.atom(p)
    case 'falsum':
      return f.falsum(p)
    case 'verum':
      return f.verum(p)
    case 'negation':
      return f.negation(p)
    case 'implication':
      return f.implication(p)
    case 'conjunction':
      return f.conjunction(p)
    case 'disjunction':
      return f.disjunction(p)
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
      array.uniq([...antecedent, ...consequent]),
    conjunction: (leftConjunct, rightConjunct) =>
      array.uniq([...leftConjunct, ...rightConjunct]),
    disjunction: (leftDisjunct, rightDisjunct) =>
      array.uniq([...leftDisjunct, ...rightDisjunct]),
  })

export const connectives = (p: Prop): Array<ConnectiveType> =>
  fold<Array<ConnectiveType>>(p, {
    atom: () => [],
    falsum: () => ['falsum'],
    verum: () => ['verum'],
    negation: (negand) => array.uniq(['negation', ...negand]),
    implication: (antecedent, consequent) =>
      array.uniq(['implication', ...antecedent, ...consequent]),
    conjunction: (leftConjunct, rightConjunct) =>
      array.uniq(['conjunction', ...leftConjunct, ...rightConjunct]),
    disjunction: (leftDisjunct, rightDisjunct) =>
      array.uniq(['disjunction', ...leftDisjunct, ...rightDisjunct]),
  })

export const models = (p: Prop): seq.Seq<Valuation> => {
  return seq.filter(valuations(atoms(p)), (v) => isModel(v, p))
}

export const countermodels = (p: Prop): seq.Seq<Valuation> => {
  return seq.filter(valuations(atoms(p)), (v) => isCountermodel(v, p))
}

export const isContradiction = (p: Prop): boolean => {
  return seq.isEmpty(models(p))
}

export const isSatisfiable = (p: Prop): boolean => {
  return !isContradiction(p)
}

export const isTautology = (p: Prop): boolean => {
  return seq.isEmpty(countermodels(p))
}

export const isFalsifiable = (p: Prop): boolean => {
  return !isTautology(p)
}

export const random =
  (size: number = 10) =>
  (): Prop => {
    const rand = Math.random()
    if (size < 1) {
      if (rand < 0.05) {
        return falsum
      }
      if (rand < 0.1) {
        return verum
      }
      if (rand < 0.2) {
        return atom('s')
      }
      if (rand < 0.45) {
        return atom('r')
      }
      if (rand < 0.7) {
        return atom('q')
      }
      return atom('p')
    }
    const next = size - 1
    const [left, right] = splitAt(next, Math.random())
    if (rand < 0.3) {
      return conjunction(random(left)(), random(right)())
    }
    if (rand < 0.6) {
      return disjunction(random(left)(), random(right)())
    }
    if (rand < 0.9) {
      return implication(random(left)(), random(right)())
    }
    return negation(random(next)())
  }

type WeightedChoice<T> = { weight: number; value: T }

const pickWeighted = <T>(choices: Array<WeightedChoice<T>>): T | undefined => {
  const total = choices.reduce((sum, c) => sum + c.weight, 0)
  if (total <= 0) return undefined
  let rand = Math.random() * total
  for (const c of choices) {
    rand -= c.weight
    if (rand < 0) return c.value
  }
  const last = choices[choices.length - 1]
  return last?.value
}

export const randomWeighted =
  (
    size: number,
    connectives: {
      negation: number
      implication: number
      conjunction: number
      disjunction: number
    },
    symbols: {
      p: number
      q: number
      r: number
      s: number
      u: number
      v: number
      falsum: number
      verum: number
    },
  ): (() => Prop) =>
  (): Prop => {
    if (size < 1) {
      const leaf = pickWeighted<Prop>([
        { weight: symbols.p, value: atom('p') },
        { weight: symbols.q, value: atom('q') },
        { weight: symbols.r, value: atom('r') },
        { weight: symbols.s, value: atom('s') },
        { weight: symbols.u, value: atom('u') },
        { weight: symbols.v, value: atom('v') },
        { weight: symbols.falsum, value: falsum },
        { weight: symbols.verum, value: verum },
      ])
      return leaf ?? atom('p')
    }
    const next = size - 1
    const [left, right] = splitAt(next, Math.random())
    const branch = pickWeighted<() => Prop>([
      {
        weight: connectives.conjunction,
        value: () =>
          conjunction(
            randomWeighted(left, connectives, symbols)(),
            randomWeighted(right, connectives, symbols)(),
          ),
      },
      {
        weight: connectives.disjunction,
        value: () =>
          disjunction(
            randomWeighted(left, connectives, symbols)(),
            randomWeighted(right, connectives, symbols)(),
          ),
      },
      {
        weight: connectives.implication,
        value: () =>
          implication(
            randomWeighted(left, connectives, symbols)(),
            randomWeighted(right, connectives, symbols)(),
          ),
      },
      {
        weight: connectives.negation,
        value: () => negation(randomWeighted(next, connectives, symbols)()),
      },
    ])
    return branch ? branch() : atom('p')
  }
