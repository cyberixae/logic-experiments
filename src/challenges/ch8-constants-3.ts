import { lk } from '../systems/lk'
import { sequent } from '../model/sequent'
import { challenge } from '../model/challenge'

const { a, o, z, i } = lk

const rules = [
  'f',
  'v',
  'swl',
  'swr',
  'sRotLF',
  'sRotRF',
  'sRotLB',
  'sRotRB',
] as const

const goal = sequent([a('p'), o.p0.verum, a('q')], [a('q'), o.p0.verum, a('p')])

const solution = z.sRotRF(
  z.swl(
    a('q'),
    z.swl(o.p0.verum, z.swl(a('p'), z.swr(a('p'), z.swr(a('q'), i.v())))),
  ),
)

export const ch8constants3 = challenge({ rules, goal, solution })
