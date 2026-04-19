import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, i } = ttr

const rules = ['tiq'] as const

const pinned = ['tiq'] as const

const goal = sequent([a('q')], [a('q')])

const solution = i.tiq()

export const ttrCh12 = tutorial({ rules, goal, solution, pinned })
