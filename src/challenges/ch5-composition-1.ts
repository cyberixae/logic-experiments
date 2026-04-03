import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = ['i', 'swl', 'swr', 'cl', 'dr'] as const

const goal = sequent([o.p2.conjunction(a('p'), a('q'))], [a('q'), a('p')])

const solution = z.cl(z.swl(a('q'), z.swr(a('q'), i.i(a('p')))))

export const ch5composition1 = challenge({ rules, goal, solution })
