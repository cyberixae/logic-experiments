import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tswa', 'tswba', 'tsrotf', 'tsrotb'] as const
const pinned = ['tswa', 'tswba'] as const
const goal = sequent([a('q')], [verum])
const solution = z.tswa(a('q'),i.v())

export const ttrCh2_2 = tutorial({ rules, goal, solution, pinned })
