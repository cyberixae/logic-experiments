import { isNonEmptyArray, rotate, zip } from '../utils/array'
import * as seq from '../utils/seq'
import type { Prop } from './prop'
import * as prop from './prop'

export type Formulas = Array<Prop>

export const equals = (fa: Formulas, fb: Formulas): boolean => {
  return (
    fa.length === fb.length && zip(fa, fb).every(([a, b]) => prop.equals(a, b))
  )
}

export const rotations = (fs: Formulas): seq.Seq<Formulas> =>
  function* () {
    yield fs
    if (!isNonEmptyArray(fs)) {
      return
    }
    let tmp = rotate(fs)
    while (tmp[0] !== fs[0]) {
      yield tmp
      tmp = rotate(tmp)
    }
  }
