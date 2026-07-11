import { rk, rules } from '../../systems/rk'
import { sequent } from '../../model/sequent'
import { equalsDerivation } from '../../model/derivation'
import { Workspace } from '../workspace'
import { reverse0, undo, reset } from '../event'

const { a, o } = rk
const p = a('p')
const q = a('q')
const goal = sequent([o.p2.conjunction(p, q)], [p])

// Build the presolved start with the engine itself: destruct the conjunction
// once, then hand the resulting derivation to a fresh workspace as `start`.
const makeStart = () => {
  const scratch = new Workspace({ presolve: { goal, rules } })
  scratch.applyEvent(reverse0('cl'))
  return scratch.currentConjecture().derivation
}

const makeWorkspace = () => {
  const start = makeStart()
  const ws = new Workspace({ presolve: { goal, rules, start } })
  return { ws, start }
}

describe('presolved challenges', () => {
  it('initializes at the start derivation, not the bare goal', () => {
    const { ws, start } = makeWorkspace()
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      true,
    )
  })

  it('floors undo at the frozen foundation', () => {
    const { ws, start } = makeWorkspace()
    ws.applyEvent(undo())
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      true,
    )
  })

  it('allows undoing the player’s own moves back to the floor, not past it', () => {
    const { ws, start } = makeWorkspace()
    ws.applyEvent(reverse0('swl')) // player: drop the extra q
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      false,
    )
    ws.applyEvent(undo()) // undo the player's move — allowed
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      true,
    )
    ws.applyEvent(undo()) // would dismantle the foundation — blocked
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      true,
    )
  })

  it('resets to the checkpoint instead of the bare goal', () => {
    const { ws, start } = makeWorkspace()
    ws.applyEvent(reverse0('swl'))
    ws.applyEvent(reset())
    expect(equalsDerivation(ws.currentConjecture().derivation, start)).toBe(
      true,
    )
  })

  it('reports canUndo honestly at the floor and above it', () => {
    const { ws } = makeWorkspace()
    expect(ws.canUndo()).toBe(false) // at the presolved floor
    ws.applyEvent(reverse0('swl'))
    expect(ws.canUndo()).toBe(true) // the player's own move can go back
    ws.applyEvent(undo())
    expect(ws.canUndo()).toBe(false) // back at the floor
  })

  it('remains solvable above the frontier', () => {
    const { ws } = makeWorkspace()
    ws.applyEvent(reverse0('swl'))
    ws.applyEvent(reverse0('i'))
    expect(ws.isSolved()).toBe(true)
  })

  it('resets to the bare goal when there is no start (regression)', () => {
    const ws = new Workspace({ plain: { goal, rules } })
    ws.applyEvent(reverse0('cl'))
    ws.applyEvent(reset())
    expect(ws.currentConjecture().derivation.kind).toBe('premise')
  })
})
