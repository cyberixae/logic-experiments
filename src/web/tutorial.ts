import { MountResult, Navigate } from './types'
import { ChallengePool } from './challenge-pool'
import { mountVersus } from './versus'
import { defaultVersusConfig, TutorInput, VersusConfig } from './versus-config'
import { tutorialStops } from '../random/tutorial'

// The tutorial runs on the Versus arena in a cooperative, untimed flavor.
// Navigation walks the stop list (chapter intro pages + beats; the
// tutorial_stop URL param addresses a stop, default = the first chapter's
// intro page). The learner's half accepts every connected human input
// device (on-screen buttons, keyboard, gamepads); the tutor half is the
// hand-driven "Wizard of Oz" rig — off by default, assignable to one
// device from the pause menu (tutorial_tutor URL param). It reuses
// mountVersus wholesale via the `tutorial` config field; the pool is
// passed through but goes unused (challenges are generated per beat).
export const mountTutorial = (
  container: HTMLElement,
  navigate: Navigate,
  pool: ChallengePool,
  startStop: number,
  tutorInput: TutorInput,
): MountResult => {
  const stop = Math.max(0, Math.min(startStop, tutorialStops.length - 1))
  const config: VersusConfig = {
    ...defaultVersusConfig(),
    // Neutralize the Versus defaults (p2 would be an NPC); the tutorial's
    // input wiring never consults these.
    p1Input: 'mouse',
    p2Input: 'mouse',
    tutorial: { startStop: stop, tutorInput },
  }
  return mountVersus(container, navigate, pool, config)
}
