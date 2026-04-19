import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tswp', 'tswq', 'tswpp', 'tswpq', 'tswqp', 'tswqq', 'tsrotf', 'tsrotb'] as const
const pinned = ['tswq', 'tswp', 'tswpp', 'tswpq', 'tswqp', 'tswqq'] as const
const goal = sequent([a('q'), a('p')], [verum])
const solution = z.tswqp(z.tswq(i.v()))

export const ttrCh1_6 = tutorial({ rules, goal, solution, pinned })
