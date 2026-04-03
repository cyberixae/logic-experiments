import { lk } from '../systems/lk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr', 'ir'] as const

const goal = conclusion(
  o.p2.implication(a('r'), o.p2.implication(a('q'), a('q'))),
)

const solution = z.ir(z.swl(a('r'), z.ir(i.i(a('q')))))

export const ch4theorem6 = challenge({ rules, goal, solution })
