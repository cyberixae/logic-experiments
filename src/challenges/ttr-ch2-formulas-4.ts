import { ttr } from '../systems/ttr'
import { sequent } from '../model/sequent'
import { verum } from '../model/prop'
import { tutorial } from '../model/challenge'

const { a, i, z } = ttr

const rules = ['v', 'tswa', 'tswba', 'tsrotf', 'tsrotb'] as const
const pinned = ['tswa', 'tswba'] as const
const goal = sequent([a('p'), a('q')], [verum])
const solution = ttr.tswba(a('q'),ttr.tswa(a('p'),i.v()))

export const ttrCh2_4 = tutorial({ rules, goal, solution, pinned })
