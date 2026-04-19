import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tsw', 'tsrotf', 'tsrotb'] as const
const pinned = ['tsw'] as const
const goal = sequent([a('p'), a('q')], [verum])
const solution = z.tswq(i.v())

export const ttrCh3_4 = tutorial({ rules, goal, solution, pinned })
