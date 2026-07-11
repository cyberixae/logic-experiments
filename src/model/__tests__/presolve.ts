import { rk } from '../../systems/rk'
import { sequent } from '../sequent'
import { premise, transformation, openBranches } from '../derivation'
import { pruneClosings, pruneStructural } from '../presolve'

const { a, o } = rk
const p = a('p')
const q = a('q')
const { conjunction } = o.p2

// A small solution shaped like real play: destruct the conjunction, drop the
// extra atom, close.
//   i:   p ⊢ p
//   swl: p, q ⊢ p
//   cl:  p∧q ⊢ p
const closed = sequent([p], [p])
const dropped = sequent([p, q], [p])
const goal = sequent([conjunction(p, q)], [p])
const solution = transformation(
  goal,
  [transformation(dropped, [transformation(closed, [], 'i')], 'swl')],
  'cl',
)

describe('pruneClosings (stage-1 frontier)', () => {
  it('replaces exactly the closing moves with open premises', () => {
    const start = pruneClosings(solution)
    expect(start).toEqual(
      transformation(
        goal,
        [transformation(dropped, [premise(closed)], 'swl')],
        'cl',
      ),
    )
  })

  it('leaves every open leaf one Close away', () => {
    const start = pruneClosings(solution)
    expect(openBranches(start)).toHaveLength(1)
  })

  it('keeps premises untouched', () => {
    expect(pruneClosings(premise(goal))).toEqual(premise(goal))
  })
})

describe('pruneStructural (stage-2 frontier)', () => {
  it('cuts each branch above its topmost connective rule', () => {
    const start = pruneStructural(solution)
    // The cl stays frozen; the structural tail (swl, i) reopens.
    expect(start).toEqual(transformation(goal, [premise(dropped)], 'cl'))
  })

  it('degenerates to the bare goal for a purely structural proof', () => {
    const structuralOnly = transformation(
      dropped,
      [transformation(closed, [], 'i')],
      'swl',
    )
    expect(pruneStructural(structuralOnly)).toEqual(premise(dropped))
  })

  it('keeps premises untouched', () => {
    expect(pruneStructural(premise(goal))).toEqual(premise(goal))
  })
})
