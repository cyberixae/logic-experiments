import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, z, i } = rk

const rules = ['i', 'swl', 'swr'] as const

const goal = sequent([a('p'), a('q')], [a('p')])

const solution = z.swl(a('q'), i.i(a('p')))

export const ch1weakening1 = challenge({ rules, goal, solution })
