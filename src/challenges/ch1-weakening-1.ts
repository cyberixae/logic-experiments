import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr'] as const

const goal = sequent([a('p'), a('q')], [a('p')])

const solution = z.swl(a('q'), i.i(a('p')))

export const ch1weakening1 = challenge({ rules, goal, solution })
