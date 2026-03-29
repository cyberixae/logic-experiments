import { isNonEmptyArray } from '../utils/array'
import { Lazy } from '../utils/lazy'
import { Seq, map } from '../utils/seq'
import { fold, Prop } from './prop'

export type Valuation = Record<string, boolean>

export const empty: Valuation = {}

export const valuations = (atoms: Array<string>): Seq<Valuation> =>
  function* () {
    if (!isNonEmptyArray(atoms)) {
      yield empty
      return
    }
    const [x, ...xs] = atoms
    const t = { [x]: true }
    const f = { [x]: false }
    const vs = valuations(xs)
    yield* map(vs, (v) => ({ ...v, ...t }))()
    yield* map(vs, (v) => ({ ...v, ...f }))()
  }

export const satisfies = (v: Valuation, p: Prop) =>
  fold<Lazy<boolean | null>>(p, {
    atom: (value) => () => v[value] ?? null,
    falsum: () => () => false,
    verum: () => () => true,
    negation: (negand) => () => {
      const n = negand()
      if (n === null) {
        return null
      }
      return !n
    },
    implication: (antecedent, consequent) => () => {
      const a = antecedent()
      if (a === false) {
        return true
      }
      const c = consequent()
      if (c === true) {
        return true
      }
      if (a === null) {
        return null
      }
      if (c === null) {
        return null
      }
      return false
    },
    conjunction: (leftConjunct, rightConjunct) => () => {
      const l = leftConjunct()
      if (l === false) {
        return false
      }
      const r = rightConjunct()
      if (r === false) {
        return false
      }
      if (l === null) {
        return null
      }
      if (r === null) {
        return null
      }
      return true
    },
    disjunction: (leftDisjunct, rightDisjunct) => () => {
      const l = leftDisjunct()
      if (l === true) {
        return true
      }
      const r = rightDisjunct()
      if (r === true) {
        return true
      }
      if (l === null) {
        return null
      }
      if (r === null) {
        return null
      }
      return false
    },
  })

export const isModel = (v: Valuation, p: Prop) => satisfies(v, p)() ?? false
export const isCountermodel = (v: Valuation, p: Prop) => !isModel(v, p)
