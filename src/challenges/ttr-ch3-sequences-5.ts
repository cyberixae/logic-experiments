import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tsw', 'tsrotf', 'tsrotb'] as const
const pinned = ['tsw'] as const
const goal = sequent([a('q'), a('q')], [verum])
const solution = z.tswqq(z.tswq(i.v()))

export const ttrCh3_5 = tutorial({ rules, goal, solution, pinned })
