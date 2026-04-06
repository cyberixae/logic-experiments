import { rk } from '../systems/rk'
import { conclusion } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'ir'] as const

const goal = conclusion(
  o.p2.implication(
    o.p2.conjunction(a('q'), a('q')),
    o.p2.conjunction(a('q'), a('q')),
  ),
)

const solution = z.ir(i.i(o.p2.conjunction(a('q'), a('q'))))

export const ch4theorem2 = challenge({ rules, goal, solution })
