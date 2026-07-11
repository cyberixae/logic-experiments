import { MountResult, Navigate } from './types'
import { ChallengePool } from './challenge-pool'
import { mountVersus } from './versus'
import { defaultVersusConfig, PlayerInput, VersusConfig } from './versus-config'
import { tutorialCurriculum } from '../random/tutorial'

// The tutorial's first prototype is the Versus arena in a cooperative,
// hand-driven "Wizard of Oz" flavor: by default a learner on the mouse
// (on-screen buttons) and a tutor on the keyboard, both on the same untimed
// clamped practice stream; both inputs are configurable from the pause menu
// (tutorial_p1 / tutorial_p2 URL params). It reuses mountVersus wholesale via
// the `tutorial` config field; the pool is passed through but goes unused
// (challenges are generated per beat).
export const mountTutorial = (
  container: HTMLElement,
  navigate: Navigate,
  pool: ChallengePool,
  startBeat: number,
  p1Input: PlayerInput,
  p2Input: PlayerInput,
): MountResult => {
  const beat = Math.max(0, Math.min(startBeat, tutorialCurriculum.length - 1))
  const config: VersusConfig = {
    ...defaultVersusConfig(),
    p1Input,
    p2Input,
    tutorial: { startBeat: beat },
  }
  return mountVersus(container, navigate, pool, config)
}
