import { NonEmptyArray, ensureNonEmpty } from './array'

export const split = (s: string, c: string): NonEmptyArray<string> =>
  ensureNonEmpty(s.split(c), s)
