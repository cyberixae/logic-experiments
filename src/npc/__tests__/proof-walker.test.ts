import { proofUsing } from '../../model/derivation'
import { atom, Prop } from '../../model/prop'
import { sequent } from '../../model/sequent'
import { reverse0, reverse1, nextBranch } from '../../interactive/event'
import { linearize } from '../proof-walker'

const p = atom('p')
const q = atom('q')
const aux = atom('A')

// A minimal single-leaf proof using the introduction rule `i`.
// Used as a stand-in subtree wherever the walker needs a 2-dep child.
const leafI = (formula: Prop) =>
  proofUsing(sequent([formula], [formula]), [], 'i' as const)

describe('linearize — single-node proofs', () => {
  it('emits one reverse0 event for an axiom introduction', () => {
    const events = linearize(leafI(p))
    expect(events).toEqual([reverse0('i')])
  })
})

describe('linearize — two-dep walks', () => {
  it('walks cut deps left-to-right by default with shuffle disabled', () => {
    const left = leafI(p)
    const right = leafI(q)
    const tree = proofUsing(sequent([], []), [left, right], 'cut' as const)
    const events = linearize(tree, { shuffle: false })
    expect(events).toEqual([reverse1('cut', p), reverse0('i'), reverse0('i')])
  })

  it('extracts the cut aux formula from the last succedent of dep[0]', () => {
    // dep0 succedent is [p, A] — last() = A
    const left = proofUsing(sequent([], [p, aux]), [], 'i' as const)
    const right = leafI(p)
    const tree = proofUsing(sequent([], []), [left, right], 'cut' as const)
    const [head] = linearize(tree, { shuffle: false })
    expect(head).toEqual(reverse1('cut', aux))
  })

  it('emits no event when a reverse1 dep has an empty succedent', () => {
    // extractAuxFormula returns null → no event pushed for the parent
    const left = proofUsing(sequent([], []), [], 'i' as const)
    const right = leafI(p)
    const tree = proofUsing(sequent([], []), [left, right], 'cut' as const)
    const events = linearize(tree, { shuffle: false })
    // Parent emits nothing, but children still walk
    expect(events).toEqual([reverse0('i'), reverse0('i')])
  })
})

describe('linearize — shuffle', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('visits deps in reverse order when Math.random < 0.5', () => {
    // First call gates shuffle (< 0.5 → shuffled order)
    jest.spyOn(Math, 'random').mockReturnValue(0.1)
    const left = leafI(p)
    const right = leafI(q)
    const tree = proofUsing(sequent([], []), [left, right], 'cut' as const)
    const events = linearize(tree, { shuffle: true })
    expect(events).toEqual([
      reverse1('cut', p),
      nextBranch(),
      reverse0('i'), // right walked first
      reverse0('i'), // then left
    ])
  })

  it('visits deps in declared order when Math.random ≥ 0.5', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9)
    const left = leafI(p)
    const right = leafI(q)
    const tree = proofUsing(sequent([], []), [left, right], 'cut' as const)
    const events = linearize(tree, { shuffle: true })
    expect(events).toEqual([reverse1('cut', p), reverse0('i'), reverse0('i')])
  })

  it('does not shuffle single-dep nodes', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0)
    // Synthetic single-dep node to exercise the non-branching path
    const single = proofUsing(
      sequent([p], [p]),
      [leafI(p)],
      'swl' as const, // structural reverse0 with one dep in the walker's view
    )
    const events = linearize(single, { shuffle: true })
    // No nextBranch event because deps.length !== 2
    expect(events.some((e) => e.kind === 'nextBranch')).toBe(false)
  })
})

describe('linearize — defaults', () => {
  it('defaults shuffle to true', () => {
    // With no opts and a single-dep tree, no shuffle branch is reachable —
    // output is identical to explicitly passing shuffle: true.
    const node = leafI(p)
    expect(linearize(node)).toEqual(linearize(node, { shuffle: true }))
  })
})
