import { zip } from '../utils/array'
import type { Prop } from './prop'
import * as prop from './prop'

export type Formulas = Array<Prop>

export const equals = (aa: Formulas, ab: Formulas): boolean => {
  return (
    aa.length === ab.length && zip(aa, ab).every(([a, b]) => prop.equals(a, b))
  )
}
