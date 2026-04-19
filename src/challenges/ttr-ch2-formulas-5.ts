import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tswa', 'tswba', 'tsrotf', 'tsrotb'] as const
const pinned = ['tswa', 'tswba'] as const
const goal = sequent([a('q'), a('q')], [verum])
const solution = z.tswba(a('q'),z.tswa(a('q'),i.v()))

export const ttrCh2_5 = tutorial({ rules, goal, solution, pinned })
