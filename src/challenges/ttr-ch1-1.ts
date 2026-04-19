import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, i } = ttr

const rules = ['tip'] as const

const pinned = ['tip'] as const

const goal = sequent([a('p')], [a('p')])

const solution = i.tip()

export const ttrCh11 = tutorial({ rules, goal, solution, pinned })
