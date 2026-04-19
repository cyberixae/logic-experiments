import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { i } = ttr

const rules = ['v', 'tswp', 'tswq', 'tswpp', 'tswpq', 'tswqp', 'tswqq', 'tsrotf', 'tsrotb'] as const
const pinned = ['v'] as const
const goal = sequent([], [verum])
const solution = i.v()

export const ttrCh0_1 = tutorial({ rules, goal, solution, pinned })
