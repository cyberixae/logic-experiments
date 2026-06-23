import { rk } from '../../systems/rk'
import { sequent, conclusion, isConclusion } from '../sequent'
import {
  premise,
  proof,
  toProof,
  refinePremise,
  isProof,
  transformation,
} from '../derivation'

const { a, z, i } = rk

const p = a('p')
const q = a('q')

describe('proof', () => {
  it('builds a transformation node from result, deps and rule', () => {
    const leaf = i.i(p)
    const built = proof(sequent([], [p]), [leaf], 'swl')
    expect(built.kind).toBe('transformation')
    expect(built.rule).toBe('swl')
    expect(built.deps).toEqual([leaf])
    expect(built.result).toEqual(sequent([], [p]))
  })
})

describe('toProof', () => {
  it('returns the derivation when it has no open branches', () => {
    const complete = z.swl(q, i.i(p))
    const result = toProof(complete)
    expect(result).toBe(complete)
  })

  it('returns null when the derivation still has an open premise', () => {
    const open = transformation(
      sequent([], [p]),
      [premise(conclusion(p))],
      'swl',
    )
    expect(isProof(open)).toBe(false)
    expect(toProof(open)).toBe(null)
  })
})

describe('refinePremise', () => {
  it('refines a premise whose result matches the inner refinement', () => {
    const prem = premise(conclusion(p))
    expect(refinePremise(isConclusion)(prem)).toBe(true)
  })

  it('rejects a premise whose result fails the inner refinement', () => {
    const prem = premise(sequent([p], [q]))
    expect(refinePremise(isConclusion)(prem)).toBe(false)
  })
})
