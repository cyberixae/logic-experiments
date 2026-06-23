import { GameMode } from '../model/mode'

export type Screen =
  | GameMode
  | 'menu'
  | 'secret'
  | 'system'
  | 'random-config'
  | 'versus'
  | 'versus-config'
export type Navigate = (screen: Screen) => void
export type MountResult = { cleanup: () => void; rerender: () => void }
