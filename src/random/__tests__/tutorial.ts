import { generateUnsolvableChallenge, tutorialCurriculum } from '../tutorial'
import { isTautology } from '../../model/sequent'
import { reachableRules } from '../../model/closure'

describe('generateUnsolvableChallenge', () => {
  it('always yields a goal with no proof (invalid sequent, no solution)', () => {
    for (let i = 0; i < 20; i += 1) {
      const result = generateUnsolvableChallenge()
      expect(isTautology(result.challenge.goal)).toBe(false)
      expect(result.challenge.solution).toBeUndefined()
    }
  })

  it('yields goals with at least one connective to take apart', () => {
    for (let i = 0; i < 20; i += 1) {
      const result = generateUnsolvableChallenge()
      const closure = reachableRules(result.challenge.goal)
      expect(closure.length).toBeGreaterThan(0)
    }
  })

  it('never allows Cut', () => {
    const result = generateUnsolvableChallenge()
    expect(result.challenge.rules.includes('cut')).toBe(false)
  })
})

describe('tutorialCurriculum', () => {
  it('shows Skip only from the Solvability chapter on', () => {
    const firstShown = tutorialCurriculum.findIndex((b) => !b.hideSkip)
    expect(firstShown).toBeGreaterThan(-1)
    expect(tutorialCurriculum[firstShown]?.chapter).toBe('solvability')
    tutorialCurriculum.forEach((beat, i) => {
      expect(beat.hideSkip).toBe(i < firstShown)
    })
  })
})
