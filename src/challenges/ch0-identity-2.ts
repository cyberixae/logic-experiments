import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i'] as const

const goal = sequent([a('q')], [a('q')])

const solution = i.i(a('q'))

export const ch0identity2 = challenge({ rules, goal, solution })
