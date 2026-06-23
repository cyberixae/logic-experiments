import { rk, rules } from '../../systems/rk'
import { sequent } from '../sequent'
import {
  configuration,
  challenge,
  tutorial,
  isChallenge,
  isTutorial,
} from '../challenge'

const { a, z, i } = rk

const goal = sequent([a('p'), a('q')], [a('p')])
const solution = z.swl(a('q'), i.i(a('p')))

describe('configuration', () => {
  it('preserves goal and rules on the returned config', () => {
    const c = configuration({ goal, rules })
    expect(c.goal).toBe(goal)
    expect(c.rules).toBe(rules)
  })

  it('produces a config that is not yet a challenge (no solution)', () => {
    const c = configuration({ goal, rules })
    expect(isChallenge(c)).toBe(false)
  })
})

describe('tutorial', () => {
  it('preserves goal, solution and pinned rules', () => {
    const t = tutorial({ goal, rules, solution, pinned: ['swl'] })
    expect(t.goal).toBe(goal)
    expect(t.solution).toBe(solution)
    expect(t.pinned).toEqual(['swl'])
  })

  it('is recognized as both a challenge and a tutorial', () => {
    const t = tutorial({ goal, rules, solution, pinned: ['i'] })
    expect(isChallenge(t)).toBe(true)
    expect(isTutorial(t)).toBe(true)
  })

  it('a plain challenge is not a tutorial', () => {
    const c = challenge({ goal, rules, solution })
    expect(isChallenge(c)).toBe(true)
    expect(isTutorial(c)).toBe(false)
  })
})
