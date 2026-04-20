import { GameMode } from '../model/mode'

export type Screen =
  | GameMode
  | 'menu'
  | 'system'
  | 'random-config'
  | 'quiz-config'
export type Navigate = (screen: Screen) => void
export type MountResult = { cleanup: () => void; rerender: () => void }
