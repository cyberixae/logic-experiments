import { Atom, atom } from '../model/prop'
import { applyTip } from '../rules/tip'
import { applyTiq } from '../rules/tiq'

export const alpha = <
  S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`,
>(
  s: S,
): Atom<S> => atom(s)

const iota = {
  tip: applyTip,
  tiq: applyTiq,
}

export const rules = ['tip', 'tiq'] as const

export const name = 'TTR'

export const ttr = {
  a: alpha,
  i: iota,
}
