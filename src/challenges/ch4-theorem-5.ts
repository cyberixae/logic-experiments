import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr', 'ir'] as const

const pinned = ['ir'] as const

const goal = conclusion(
  o.p2.implication(a('q'), o.p2.implication(a('r'), a('q'))),
)

const solution = z.ir(z.ir(z.swl(a('r'), i.i(a('q')))))

export const ch4theorem5 = tutorial({ rules, goal, solution, pinned })
