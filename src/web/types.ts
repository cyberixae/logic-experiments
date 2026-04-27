import { GameMode } from '../model/mode'

export type Screen =
  | GameMode
  | 'menu'
  | 'secret'
  | 'system'
  | 'random-config'
  | 'match-config'
  | 'match-intro'
  | 'match-curated'
export type Navigate = (screen: Screen) => void
export type MountResult = { cleanup: () => void; rerender: () => void }
