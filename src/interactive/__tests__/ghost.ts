import { computeGhostChain } from '../ghost'
import { sequent, conclusion } from '../../model/sequent'
import { atom, conjunction, negation, verum } from '../../model/prop'

const p = atom('p')

describe('computeGhostChain', () => {
  it('captures both branches of a branching final rule (cr)', () => {
    const goal = conclusion(conjunction(verum, p))
    const chain = computeGhostChain(
      goal,
      { side: 'right', index: 0 },
      'connective',
      ['cr'],
    )
    expect(chain).not.toBeNull()
    expect(chain).toHaveLength(1)
    const step = chain?.[0]
    expect(step?.rule).toBe('cr')
    expect(step?.sequents).toEqual([conclusion(verum), conclusion(p)])
  })

  it('produces a single-sequent step for a linear rule (nr)', () => {
    const goal = conclusion(negation(p))
    const chain = computeGhostChain(
      goal,
      { side: 'right', index: 0 },
      'connective',
      ['nr'],
    )
    expect(chain).not.toBeNull()
    expect(chain).toHaveLength(1)
    const step = chain?.[0]
    expect(step?.rule).toBe('nr')
    expect(step?.sequents).toEqual([sequent([p], [])])
  })
})
