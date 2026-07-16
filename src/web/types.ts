import { GameMode } from '../model/mode'

export type Screen =
  | GameMode
  | 'menu'
  | 'secret'
  | 'system'
  | 'gallery'
  | 'random-config'
  | 'versus'
  | 'versus-config'
  | 'tutorial'
export type Navigate = (screen: Screen) => void
export type MountResult = { cleanup: () => void; rerender: () => void }
