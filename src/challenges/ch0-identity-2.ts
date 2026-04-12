import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, i } = rk

const rules = [
  'i',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const pinned = ['i'] as const

const goal = sequent([a('q')], [a('q')])

const solution = i.i(a('q'))

export const ch0identity2 = tutorial({ rules, goal, solution, pinned })
