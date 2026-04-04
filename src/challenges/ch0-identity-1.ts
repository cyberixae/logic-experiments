import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, i } = lk

const rules = ['i'] as const

const goal = sequent([a('p')], [a('p')])

const solution = i.i(a('p'))

export const ch0identity1 = challenge({ rules, goal, solution })
