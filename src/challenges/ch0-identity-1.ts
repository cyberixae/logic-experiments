import { rk, rules } from '../systems/rk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, i } = rk

const goal = sequent([a('p')], [a('p')])

const solution = i.i(a('p'))

export const ch0identity1 = challenge({ rules, goal, solution })
