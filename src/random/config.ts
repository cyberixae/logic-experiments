export type ConnectiveWeights = {
  negation: number
  implication: number
  conjunction: number
  disjunction: number
}

export type SymbolWeights = {
  p: number
  q: number
  r: number
  s: number
  u: number
  v: number
  falsum: number
  verum: number
}

export type RandomConfig = {
  size: number
  connectives: ConnectiveWeights
  symbols: SymbolWeights
  targetNonStructural: number
  bypassPercent: number
}

export const defaultRandomConfig = (): RandomConfig => ({
  size: 10,
  connectives: {
    negation: 1,
    implication: 3,
    conjunction: 3,
    disjunction: 3,
  },
  symbols: {
    p: 6,
    q: 5,
    r: 5,
    s: 2,
    u: 1,
    v: 1,
    falsum: 1,
    verum: 1,
  },
  targetNonStructural: 10,
  bypassPercent: 0,
})
