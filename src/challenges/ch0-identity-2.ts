import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, i } = rk

const goal = sequent([a('q')], [a('q')])

const solution = i.i(a('q'))

export const ch0identity2 = challenge({ rules, goal, solution })
