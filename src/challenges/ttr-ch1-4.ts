import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, i } = ttr

const rules = ['tip', 'tiq'] as const

const pinned = ['tip', 'tiq'] as const

const goal = sequent([a('q')], [a('q')])

const solution = i.tiq()

export const ttrCh14 = tutorial({ rules, goal, solution, pinned })
