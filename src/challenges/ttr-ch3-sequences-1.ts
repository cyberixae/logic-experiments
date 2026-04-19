import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tsw', 'tsrotf', 'tsrotb'] as const
const pinned = ['tsw'] as const
const goal = sequent([a('p')], [verum])
const solution = ttr.tsw(a('p'),i.v())

export const ttrCh3_1 = tutorial({ rules, goal, solution, pinned })
