import { Atom, atom } from '../model/prop'
import { ruleV } from '../rules/v'
import { ruleTSW } from '../rules/tsw'
import { ruleTSWA } from '../rules/tswa'
import { ruleTSWBA } from '../rules/tswba'
import { ruleTSWP } from '../rules/tswp'
import { ruleTSWQ } from '../rules/tswq'
import { ruleTSWPP } from '../rules/tswpp'
import { ruleTSWPQ } from '../rules/tswpq'
import { ruleTSWQP } from '../rules/tswqp'
import { ruleTSWQQ } from '../rules/tswqq'
import { ruleTC } from '../rules/tc'
import { ruleTD } from '../rules/td'

export const alpha = <
  S extends `${'p' | 'q' | 'r' | 's' | 't' | 'u'}${number | ''}`,
>(
  s: S,
): Atom<S> => atom(s)

const iota = {
  v: ruleV.apply,
}

const zeta = {
  tsw: ruleTSW.apply,
  tswa: ruleTSWA.apply,
  tswba: ruleTSWBA.apply,
  tswp: ruleTSWP.apply,
  tswq: ruleTSWQ.apply,
  tswpp: ruleTSWPP.apply,
  tswpq: ruleTSWPQ.apply,
  tswqp: ruleTSWQP.apply,
  tswqq: ruleTSWQQ.apply,
  tc: ruleTC.apply,
  td: ruleTD.apply,
}

export const rules = [
  'v',
  'tsw',
  'tswa',
  'tswba',
  'tswp',
  'tswq',
  'tswpp',
  'tswpq',
  'tswqp',
  'tswqq',
  'tc',
  'td',
] as const

export const name = 'TTR'

export const ttr = {
  a: alpha,
  i: iota,
  z: zeta,
}
