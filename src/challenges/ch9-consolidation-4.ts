import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'i',
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
  'nl',
  'nr',
  'cl',
  'cr',
  'dl',
  'dr',
  'il',
  'ir',
] as const

const goal = conclusion(o.p2.disjunction(a('p'), o.p1.negation(a('p'))))

const solution = z.dr(z.sRotRF(z.nr(i.i(a('p')))))

export const ch9consolidation4 = challenge({ rules, goal, solution })
