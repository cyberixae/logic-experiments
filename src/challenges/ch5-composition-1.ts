import { rk } from '../systems/rk'
import { sequent } from '../model/sequent'
import { tutorial } from '../model/challenge'

const { a, o, z, i } = rk

const rules = ['i', 'swl', 'swr', 'cl', 'dr'] as const

const pinned = ['cl', 'dr'] as const

const goal = sequent([o.p2.conjunction(a('p'), a('q'))], [a('q'), a('p')])

const solution = z.cl(z.swl(a('q'), z.swr(a('q'), i.i(a('p')))))

export const ch5composition1 = tutorial({ rules, goal, solution, pinned })
